"""Redis cache configuration."""

import json
from typing import Any, Optional
import redis.asyncio as redis

from app.core.config import settings

# Create Redis client
redis_client = redis.from_url(
    settings.REDIS_URL,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,
)


class CacheManager:
    """Cache manager for Redis operations."""

    @staticmethod
    async def get(key: str) -> Optional[str]:
        """Get value from cache."""
        return await redis_client.get(key)

    @staticmethod
    async def set(
        key: str,
        value: Any,
        expire: Optional[int] = None,
    ) -> None:
        """Set value to cache."""
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await redis_client.set(key, value, ex=expire)

    @staticmethod
    async def delete(key: str) -> None:
        """Delete key from cache."""
        await redis_client.delete(key)

    @staticmethod
    async def get_json(key: str) -> Optional[Any]:
        """Get JSON value from cache."""
        value = await redis_client.get(key)
        if value:
            return json.loads(value)
        return None

    @staticmethod
    async def set_json(
        key: str,
        value: Any,
        expire: Optional[int] = None,
    ) -> None:
        """Set JSON value to cache."""
        await redis_client.set(key, json.dumps(value), ex=expire)


# Global cache manager instance
cache = CacheManager()
