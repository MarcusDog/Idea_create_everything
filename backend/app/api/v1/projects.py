"""Project API routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import get_project_service

router = APIRouter()


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get all projects."""
    service = get_project_service(db)
    return await service.get_projects(skip, limit)


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new project."""
    service = get_project_service(db)
    return await service.create_project(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a project by ID."""
    # Reject local IDs (they should only exist in frontend localStorage)
    if project_id.startswith('local-'):
        raise HTTPException(status_code=400, detail="Local projects are not stored in the database")

    service = get_project_service(db)
    project = await service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    if project_id.startswith('local-'):
        raise HTTPException(status_code=400, detail="Local projects cannot be updated via API")

    service = get_project_service(db)
    updated = await service.update_project(project_id, project)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a project."""
    if project_id.startswith('local-'):
        raise HTTPException(status_code=400, detail="Local projects cannot be deleted via API")

    service = get_project_service(db)
    deleted = await service.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return None
