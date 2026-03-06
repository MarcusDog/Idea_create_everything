"""Backup schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BackupBase(BaseModel):
    """Base backup schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class BackupCreate(BackupBase):
    """Backup creation schema."""

    project_id: UUID


class BackupUpdate(BaseModel):
    """Backup update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class BackupResponse(BackupBase):
    """Backup response schema."""

    id: UUID
    project_id: UUID
    file_path: str
    file_size: int
    status: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BackupListResponse(BaseModel):
    """Backup list response."""

    id: UUID
    name: str
    project_id: UUID
    status: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


class BackupRestoreRequest(BaseModel):
    """Backup restore request."""

    backup_id: UUID
    target_project_id: Optional[UUID] = None


class BackupRestoreResponse(BaseModel):
    """Backup restore response."""

    success: bool
    message: str
    project_id: Optional[UUID] = None
