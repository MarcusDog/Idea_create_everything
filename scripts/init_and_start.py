#!/usr/bin/env python3
"""Initialize database with default API config and start services."""

import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, '/home/tian/clawdbot/work/Idea_create_everything/backend')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

async def init_api_config():
    """Initialize default API configuration."""
    from app.models.api_config import APIConfig
    from app.models.base import Base
    from cryptography.fernet import Fernet
    import base64
    import hashlib
    
    # Create engine
    database_url = "sqlite+aiosqlite:///./data/app.db"
    engine = create_async_engine(database_url, echo=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if any config exists
        from sqlalchemy import select
        result = await session.execute(select(APIConfig))
        existing = result.scalars().first()
        
        if existing:
            print("API configuration already exists, skipping initialization.")
            return
        
        # Generate Fernet key
        secret = "dev-secret-key-change-in-production"
        key_bytes = hashlib.sha256(secret.encode()).digest()
        fernet_key = base64.urlsafe_b64encode(key_bytes)
        fernet = Fernet(fernet_key)
        
        # API keys from SPEC.md
        nvidia_api_key = "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"
        
        # Encrypt API key
        encrypted_key = fernet.encrypt(nvidia_api_key.encode()).decode()
        
        # Create default config
        config = APIConfig(
            name="NVIDIA API",
            provider="nvidia",
            api_key_encrypted=encrypted_key,
            base_url="https://integrate.api.nvidia.com",
            model="nvidia/moonshotai/kimi-k2.5",
            is_active=True,
            is_default=True,
            priority=10
        )
        
        session.add(config)
        await session.commit()
        print("✅ Default NVIDIA API configuration created successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    print("🔧 Initializing database with default API configuration...")
    asyncio.run(init_api_config())
    print("✅ Initialization complete!")
