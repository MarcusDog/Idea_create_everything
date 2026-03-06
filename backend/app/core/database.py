"""Database configuration."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Detect database type and configure engine accordingly
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite configuration
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
    )
else:
    # PostgreSQL configuration
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
    )

# Create async session factory
if settings.DATABASE_URL.startswith("sqlite"):
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
        autoflush=False,
    )
else:
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
        autoflush=False,
    )

# Create declarative base
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
