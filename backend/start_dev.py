#!/usr/bin/env python3
"""
Development server starter script.
Handles database initialization and starts the FastAPI server.
"""

import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import Base


async def init_database():
    """Initialize database tables."""
    print("Initializing database...")
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("Database initialized successfully!")


def main():
    """Main entry point."""
    print("=" * 60)
    print("Idea Create Everything - Development Server")
    print("=" * 60)
    
    # Initialize database
    asyncio.run(init_database())
    
    # Start server
    print("\nStarting Uvicorn server...")
    print(f"API URL: http://localhost:8000")
    print(f"API Docs: http://localhost:8000/docs")
    print("=" * 60)
    
    os.system("cd /home/tian/clawdbot/work/Idea_create_everything/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug")


if __name__ == "__main__":
    main()
