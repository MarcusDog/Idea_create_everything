"""Project schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Base project schema."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    domain: Optional[str] = Field(None, max_length=50)


class ProjectCreate(ProjectBase):
    """Project creation schema."""

    tree_data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    """Project update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    domain: Optional[str] = Field(None, max_length=50)
    tree_data: Optional[Dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    """Project response schema."""

    id: UUID
    tree_data: Dict[str, Any]
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
