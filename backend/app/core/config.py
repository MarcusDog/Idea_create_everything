"""Application configuration."""

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"

class Settings(BaseSettings):
    """Application settings."""

    # App
    APP_NAME: str = "Idea Create Everything"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database - Default to SQLite for development (using absolute path)
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR / 'app.db'}"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_PASSWORD: Optional[str] = None

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API
    API_PREFIX: str = "/api"
    API_V1_PREFIX: str = "/api/v1"

    # AI
    DEFAULT_AI_MODEL: str = "nvidia/moonshotai/kimi-k2.5"
    AI_API_TIMEOUT: int = 60
    AI_MAX_RETRIES: int = 3

    # Backup
    AUTO_BACKUP_INTERVAL_HOURS: int = 1
    BACKUP_RETENTION_HOURS: int = 24

    # Search
    BRAVE_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
