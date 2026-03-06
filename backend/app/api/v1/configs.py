"""API configuration routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.api_config import (
    APIConfigCreate,
    APIConfigUpdate,
    APIConfigResponse,
    APIConfigListResponse,
    APIConfigTestRequest,
    APIConfigTestResponse,
)
from app.services.config_service import get_config_service

router = APIRouter()


@router.get("/", response_model=List[APIConfigListResponse])
async def get_configs(
    include_inactive: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get all API configurations."""
    service = get_config_service(db)
    return await service.get_configs(skip, limit, include_inactive)


@router.get("/default", response_model=APIConfigResponse)
async def get_default_config(
    db: AsyncSession = Depends(get_db),
):
    """Get the default API configuration."""
    service = get_config_service(db)
    config = await service.get_default_config()
    if not config:
        raise HTTPException(status_code=404, detail="No default configuration found")
    return config


@router.post("/", response_model=APIConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_config(
    config: APIConfigCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new API configuration."""
    service = get_config_service(db)
    try:
        return await service.create_config(config)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{config_id}", response_model=APIConfigResponse)
async def get_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get an API configuration by ID."""
    service = get_config_service(db)
    config = await service.get_config_by_id(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config


@router.put("/{config_id}", response_model=APIConfigResponse)
async def update_config(
    config_id: UUID,
    config: APIConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an API configuration."""
    service = get_config_service(db)
    updated = await service.update_config(config_id, config)
    if not updated:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return updated


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an API configuration."""
    service = get_config_service(db)
    try:
        deleted = await service.delete_config(config_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Configuration not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None


@router.post("/{config_id}/test", response_model=APIConfigTestResponse)
async def test_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Test an API configuration."""
    service = get_config_service(db)
    success, message, latency_ms = await service.test_config(config_id)
    return APIConfigTestResponse(
        success=success,
        message=message,
        latency_ms=latency_ms
    )


@router.post("/{config_id}/set-default", response_model=APIConfigResponse)
async def set_default_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Set a configuration as default."""
    service = get_config_service(db)
    try:
        config = await service.set_default_config(config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return config
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{config_id}/balance")
async def get_config_balance(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get API balance for a configuration."""
    service = get_config_service(db)
    balance = await service.get_config_balance(config_id)
    return {"config_id": config_id, "balance": balance}
