#!/usr/bin/env python3
"""Seed database with initial data."""
import asyncio
import base64
from app.core.database import AsyncSessionLocal
from app.models.api_config import APIConfig

async def seed_database():
    """Add default API configuration."""
    async with AsyncSessionLocal() as session:
        # Check if any config exists
        from sqlalchemy import select
        result = await session.execute(select(APIConfig))
        existing = result.scalar_one_or_none()
        
        if existing:
            print("API config already exists, skipping seed")
            return
        
        # NVIDIA API Key from spec
        nvidia_api_key = "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"
        
        # Encrypt the API key (base64 encode for simple encryption)
        encrypted_key = base64.b64encode(nvidia_api_key.encode()).decode()
        
        # Create default NVIDIA config
        config = APIConfig(
            name="NVIDIA Default",
            provider="nvidia",
            api_key_encrypted=encrypted_key,
            base_url="https://integrate.api.nvidia.com/v1",
            model="nvidia/moonshotai/kimi-k2.5",
            is_active=True,
            is_default=True,
            priority=1,
        )
        
        session.add(config)
        await session.commit()
        print("Seeded database with default NVIDIA API configuration")

if __name__ == "__main__":
    asyncio.run(seed_database())
