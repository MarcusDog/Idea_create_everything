"""Config service layer."""

import os
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.api_config import APIConfig
from app.schemas.api_config import APIConfigCreate, APIConfigUpdate


def _get_fernet_key() -> bytes:
    """Get or generate Fernet encryption key."""
    key = os.getenv("ENCRYPTION_KEY")
    if key:
        return key.encode()
    # Generate a key from SECRET_KEY if ENCRYPTION_KEY not set
    import base64
    import hashlib
    secret = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    # Fernet key must be 32 bytes, base64-encoded
    key_bytes = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(key_bytes)


# Initialize Fernet instance
_fernet = Fernet(_get_fernet_key())


class ConfigService:
    """API configuration business logic service."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_configs(
        self, skip: int = 0, limit: int = 100, include_inactive: bool = False
    ) -> List[APIConfig]:
        """Get all API configurations."""
        query = select(APIConfig)
        if not include_inactive:
            query = query.where(APIConfig.is_active == True)
        query = query.order_by(APIConfig.priority.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_config_by_id(self, config_id: UUID) -> Optional[APIConfig]:
        """Get API config by ID."""
        result = await self.db.execute(
            select(APIConfig).where(APIConfig.id == config_id)
        )
        return result.scalar_one_or_none()

    async def get_default_config(self) -> Optional[APIConfig]:
        """Get the default API configuration."""
        result = await self.db.execute(
            select(APIConfig)
            .where(APIConfig.is_default == True, APIConfig.is_active == True)
        )
        return result.scalar_one_or_none()

    async def create_config(self, config_data: APIConfigCreate) -> APIConfig:
        """Create a new API configuration."""
        # Encrypt API key
        encrypted_key = self._encrypt_api_key(config_data.api_key)

        # If this is set as default, unset other defaults
        if config_data.is_default:
            await self._unset_other_defaults()

        config = APIConfig(
            name=config_data.name,
            provider=config_data.provider,
            api_key_encrypted=encrypted_key,
            base_url=config_data.base_url,
            model=config_data.model,
            is_active=config_data.is_active,
            is_default=config_data.is_default,
        )
        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)
        return config

    async def update_config(
        self, config_id: UUID, config_data: APIConfigUpdate
    ) -> Optional[APIConfig]:
        """Update an API configuration."""
        config = await self.get_config_by_id(config_id)
        if not config:
            return None

        update_data = config_data.model_dump(exclude_unset=True)

        # Handle API key update
        if "api_key" in update_data:
            update_data["api_key_encrypted"] = self._encrypt_api_key(
                update_data.pop("api_key")
            )

        # Handle default flag
        if update_data.get("is_default"):
            await self._unset_other_defaults(exclude_id=config_id)

        for field, value in update_data.items():
            setattr(config, field, value)

        await self.db.commit()
        await self.db.refresh(config)
        return config

    async def delete_config(self, config_id: UUID) -> bool:
        """Delete an API configuration."""
        config = await self.get_config_by_id(config_id)
        if not config:
            return False

        # Don't allow deleting the last active config
        # Get actual value from Column safely
        is_active_raw = getattr(config, 'is_active', None)
        is_active_val = bool(is_active_raw) if is_active_raw is not None else False
        if is_active_val:
            active_count = await self.db.execute(
                select(APIConfig).where(APIConfig.is_active == True)
            )
            if len(active_count.scalars().all()) <= 1:
                raise ValueError("Cannot delete the last active configuration")

        await self.db.delete(config)
        await self.db.commit()
        return True

    async def test_config(self, config_id: UUID) -> Tuple[bool, str, Optional[int]]:
        """Test an API configuration with real API call."""
        import time
        import httpx

        config = await self.get_config_by_id(config_id)
        if not config:
            return False, "Configuration not found", None

        # Safely check is_active
        is_active_raw = getattr(config, 'is_active', None)
        if not (bool(is_active_raw) if is_active_raw is not None else False):
            return False, "Configuration is inactive", None

        try:
            start_time = time.time()

            # Decrypt API key using Fernet
            api_key_encrypted_raw = getattr(config, 'api_key_encrypted', None)
            api_key_encrypted = str(api_key_encrypted_raw) if api_key_encrypted_raw is not None else ""
            if not api_key_encrypted:
                return False, "No API key configured", None
            api_key = self._decrypt_api_key(api_key_encrypted)

            # Build API URL
            base_url_raw = getattr(config, 'base_url', None)
            base_url = str(base_url_raw) if base_url_raw is not None else "https://integrate.api.nvidia.com/v1"
            if not base_url.endswith("/v1"):
                base_url = f"{base_url}/v1"

            # Make a simple test request
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }

            model_raw = getattr(config, 'model', None)
            model = str(model_raw) if model_raw is not None else "nvidia/moonshotai/kimi-k2.5"

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Hi"}],
                        "max_tokens": 5,
                    },
                )
                response.raise_for_status()

            latency_ms = int((time.time() - start_time) * 1000)
            return True, "Connection successful", latency_ms

        except httpx.HTTPStatusError as e:
            return False, f"HTTP error {e.response.status_code}: {e.response.text[:100]}", None
        except httpx.RequestError as e:
            return False, f"Request error: {str(e)}", None
        except Exception as e:
            return False, f"Error: {str(e)[:200]}", None

    async def set_default_config(self, config_id: UUID) -> Optional[APIConfig]:
        """Set a configuration as default."""
        config = await self.get_config_by_id(config_id)
        if not config:
            return None

        # Safely check is_active
        is_active_raw = getattr(config, 'is_active', None)
        if not (bool(is_active_raw) if is_active_raw is not None else False):
            raise ValueError("Cannot set inactive configuration as default")

        await self._unset_other_defaults()
        setattr(config, 'is_default', True)
        await self.db.commit()
        await self.db.refresh(config)
        return config

    async def _unset_other_defaults(self, exclude_id: Optional[UUID] = None):
        """Unset default flag on all other configs."""
        result = await self.db.execute(
            select(APIConfig).where(APIConfig.is_default == True)
        )
        for config in result.scalars().all():
            # Safely check id
            config_id_val = getattr(config, 'id', None)
            should_update = True
            if exclude_id is not None and config_id_val is not None:
                config_id_uuid = config_id_val if isinstance(config_id_val, UUID) else UUID(str(config_id_val))
                should_update = config_id_uuid != exclude_id
            if should_update:
                setattr(config, 'is_default', False)
                await self.db.commit()

    def _encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key using Fernet symmetric encryption."""
        return _fernet.encrypt(api_key.encode()).decode()

    def _decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt API key using Fernet symmetric encryption."""
        try:
            return _fernet.decrypt(encrypted_key.encode()).decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt API key: {e}")

    def mask_api_key(self, api_key: str) -> str:
        """Mask API key for display."""
        if len(api_key) <= 8:
            return "****"
        return api_key[:4] + "****" + api_key[-4:]

    async def get_config_balance(self, config_id: UUID) -> Optional[Dict]:
        """Get remaining balance for a configuration."""
        # TODO: Implement balance checking for supported providers
        return None


def get_config_service(db: AsyncSession) -> ConfigService:
    """Factory function for config service."""
    return ConfigService(db)
