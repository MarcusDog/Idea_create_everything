"""FastAPI application main entry point."""

import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine, Base


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="INFO",
    colorize=True,
)
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="7 days",
    level="INFO",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting up application...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered project planning and idea generation API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware
# Note: allow_origins cannot be ["*"] when allow_credentials=True
# Using specific origins for development
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:80",
    "http://127.0.0.1:80",
    "http://localhost",
    "http://frontend:3000",  # Docker internal network
]

# Add custom origins from settings if available
if hasattr(settings, 'CORS_ORIGINS') and settings.CORS_ORIGINS:
    if isinstance(settings.CORS_ORIGINS, str):
        allowed_origins.extend([o.strip() for o in settings.CORS_ORIGINS.split(',')])
    elif isinstance(settings.CORS_ORIGINS, list):
        allowed_origins.extend(settings.CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return JSONResponse(
        content={
            "message": "Welcome to Idea Create Everything API",
            "version": settings.APP_VERSION,
            "docs": "/docs",
        }
    )


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
