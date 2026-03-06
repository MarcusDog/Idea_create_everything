"""Project service layer."""

from typing import List, Optional, cast
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import expression

from app.models.project import Project
from app.models.node import Node
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    """Project business logic service."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_projects(self, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects with pagination."""
        result = await self.db.execute(
            select(Project)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_project_by_id(self, project_id: UUID) -> Optional[Project]:
        """Get project by ID."""
        result = await self.db.execute(
            select(Project)
            .where(Project.id == project_id)
            .options(selectinload(Project.nodes))
        )
        return result.scalar_one_or_none()

    async def create_project(self, project_data: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            name=project_data.name,
            description=project_data.description,
            domain=project_data.domain,
            tree_data=project_data.tree_data or {},
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def update_project(
        self, project_id: UUID, project_data: ProjectUpdate
    ) -> Optional[Project]:
        """Update a project."""
        project = await self.get_project_by_id(project_id)
        if not project:
            return None

        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete_project(self, project_id: UUID) -> bool:
        """Delete a project."""
        project = await self.get_project_by_id(project_id)
        if not project:
            return False

        await self.db.delete(project)
        await self.db.commit()
        return True

    async def increment_version(self, project_id: UUID) -> Optional[Project]:
        """Increment project version."""
        project = await self.get_project_by_id(project_id)
        if not project:
            return None

        # Update via update query to avoid type checker issues
        from sqlalchemy import update
        await self.db.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(version=Project.version + 1)
        )
        await self.db.commit()
        return await self.get_project_by_id(project_id)


def get_project_service(db: AsyncSession) -> ProjectService:
    """Factory function for project service."""
    return ProjectService(db)
