"""API configuration model."""

from sqlalchemy import Column, String, Boolean, Integer, Text

from app.models.base import BaseModel


class APIConfig(BaseModel):
    """API configuration model."""

    __tablename__ = "api_configs"

    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)  # nvidia, openai, custom
    api_key_encrypted = Column(Text, nullable=False)  # Encrypted API key
    base_url = Column(String(255), nullable=True)
    model = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    priority = Column(Integer, default=0, nullable=False)

    def to_dict(self) -> dict:
        """Convert to dictionary (without sensitive data)."""
        # Safely get values avoiding Column type issues
        created_at_val = getattr(self, 'created_at', None)
        created_at_str = None
        if created_at_val is not None:
            created_at_str = created_at_val.isoformat() if hasattr(created_at_val, 'isoformat') else str(created_at_val)

        # Get values safely
        id_val = getattr(self, 'id', None)
        name_val = getattr(self, 'name', None)
        provider_val = getattr(self, 'provider', None)
        base_url_val = getattr(self, 'base_url', None)
        model_val = getattr(self, 'model', None)
        is_active_val = getattr(self, 'is_active', None)
        is_default_val = getattr(self, 'is_default', None)

        return {
            "id": str(id_val) if id_val is not None else None,
            "name": str(name_val) if name_val is not None else None,
            "provider": str(provider_val) if provider_val is not None else None,
            "base_url": str(base_url_val) if base_url_val is not None else None,
            "model": str(model_val) if model_val is not None else None,
            "is_active": bool(is_active_val) if is_active_val is not None else False,
            "is_default": bool(is_default_val) if is_default_val is not None else False,
            "created_at": created_at_str,
        }
