"""Backup API routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.backup import (
    BackupCreate,
    BackupResponse,
    BackupListResponse,
    BackupRestoreRequest,
    BackupRestoreResponse,
)
from app.services.backup_service import get_backup_service

router = APIRouter()


@router.get("/", response_model=List[BackupListResponse])
async def get_backups(
    project_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get backup list."""
    service = get_backup_service(db)
    return await service.get_backups(project_id, skip, limit)


@router.post("/project/{project_id}", response_model=BackupResponse, status_code=status.HTTP_201_CREATED)
async def create_backup(
    project_id: UUID,
    backup: BackupCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a manual backup for a project."""
    service = get_backup_service(db)
    try:
        return await service.create_backup(project_id, backup, backup_type="manual")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{backup_id}", response_model=BackupResponse)
async def get_backup(
    backup_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific backup."""
    service = get_backup_service(db)
    backup = await service.get_backup_by_id(backup_id)
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    return backup


@router.post("/{backup_id}/restore", response_model=BackupRestoreResponse)
async def restore_backup(
    backup_id: UUID,
    request: BackupRestoreRequest,
    db: AsyncSession = Depends(get_db),
):
    """Restore from backup."""
    service = get_backup_service(db)
    try:
        backup = await service.restore_backup(backup_id)
        if not backup:
            raise HTTPException(status_code=404, detail="Backup not found")
        return BackupRestoreResponse(
            success=True,
            message="Backup restored successfully",
            project_id=request.target_project_id or backup.project_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{backup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_backup(
    backup_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a backup."""
    service = get_backup_service(db)
    deleted = await service.delete_backup(backup_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Backup not found")
    return None


@router.post("/cleanup")
async def cleanup_expired_backups(
    db: AsyncSession = Depends(get_db),
):
    """Clean up expired backups."""
    service = get_backup_service(db)
    count = await service.cleanup_expired_backups()
    return {"message": f"Cleaned up {count} expired backups", "count": count}


@router.get("/stats")
async def get_backup_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get backup statistics."""
    service = get_backup_service(db)
    stats = await service.get_backup_stats()
    return stats

