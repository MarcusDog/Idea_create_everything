"""Backup service layer."""

import json
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.backup import Backup
from app.schemas.backup import BackupCreate, BackupUpdate


class BackupService:
    """Backup business logic service."""

    def __init__(self, db: AsyncSession, backup_dir: str = "/app/backups"):
        self.db = db
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def get_backups(
        self, project_id: Optional[UUID] = None, skip: int = 0, limit: int = 100
    ) -> List[Backup]:
        """Get all backups with optional project filter."""
        query = select(Backup).order_by(Backup.created_at.desc())
        if project_id:
            query = query.where(Backup.project_id == project_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_backup_by_id(self, backup_id: UUID) -> Optional[Backup]:
        """Get backup by ID."""
        result = await self.db.execute(
            select(Backup).where(Backup.id == backup_id)
        )
        return result.scalar_one_or_none()

    async def create_backup(
        self,
        project_id: UUID,
        backup_data: Optional[BackupCreate] = None,
        backup_type: str = "manual",
    ) -> Backup:
        """Create a new backup for a project."""
        from app.services.project_service import ProjectService

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_name = backup_data.name if backup_data else f"backup_{timestamp}"
        filename = f"{project_id}_{timestamp}.json"
        file_path = self.backup_dir / filename

        # Get project data
        project_service = ProjectService(self.db)
        project = await project_service.get_project_by_id(project_id)

        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Export project data
        export_data = {
            "project": {
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "domain": project.domain,
                "tree_data": project.tree_data,
                "version": project.version,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
            },
            "backup_info": {
                "name": backup_name,
                "description": backup_data.description if backup_data else None,
                "created_at": datetime.utcnow().isoformat(),
                "version": "1.0",
            },
        }

        # Write backup file
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        # Calculate file size
        file_size = file_path.stat().st_size

        # Create backup record
        expires_at = datetime.utcnow() + timedelta(days=30)
        backup = Backup(
            project_id=project_id,
            name=backup_name,
            description=backup_data.description if backup_data else None,
            file_path=str(file_path),
            file_size=file_size,
            expires_at=expires_at,
            backup_type=backup_type,
            status="success",
        )
        self.db.add(backup)
        await self.db.commit()
        await self.db.refresh(backup)
        return backup

    async def delete_backup(self, backup_id: UUID) -> bool:
        """Delete a backup."""
        backup = await self.get_backup_by_id(backup_id)
        if not backup:
            return False

        # Delete file - get actual value from Column
        file_path_val = backup.file_path
        file_path = str(file_path_val) if file_path_val is not None else None
        if file_path:
            try:
                Path(file_path).unlink(missing_ok=True)
            except OSError:
                pass

        # Delete record
        await self.db.delete(backup)
        await self.db.commit()
        return True

    async def restore_backup(self, backup_id: UUID) -> Optional[Backup]:
        """Restore project from backup."""
        from app.services.project_service import ProjectService

        backup = await self.get_backup_by_id(backup_id)
        if not backup:
            return None

        try:
            # Get actual values from Column objects
            file_path_val = getattr(backup, 'file_path', None)
            file_path = str(file_path_val) if file_path_val is not None else None
            if not file_path:
                raise ValueError("Backup file path not found")

            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Restore project data
            project_data = data.get("project", {})
            if not project_data:
                raise ValueError("Invalid backup data: missing project information")

            project_service = ProjectService(self.db)
            # Safely get project_id from backup
            project_id_attr = getattr(backup, 'project_id', None)
            if project_id_attr is None:
                raise ValueError("Backup has no associated project")
            # Convert to UUID
            from uuid import UUID as UUIDType
            project_id_val = project_id_attr if isinstance(project_id_attr, UUIDType) else UUIDType(str(project_id_attr))
            project = await project_service.get_project_by_id(project_id_val)

            if not project:
                raise ValueError(f"Project {project_id_val} not found")

            # Update project with backed-up data
            from app.schemas.project import ProjectUpdate
            restore_update = ProjectUpdate(
                name=project_data.get("name"),
                description=project_data.get("description"),
                domain=project_data.get("domain"),
                tree_data=project_data.get("tree_data"),
            )
            await project_service.update_project(project_id_val, restore_update)

            # Update backup status using SQLAlchemy's setattr on instance
            setattr(backup, 'status', "restored")
            await self.db.commit()

            return backup

        except Exception as e:
            # Update backup status using SQLAlchemy's setattr
            setattr(backup, 'status', "failed")
            await self.db.commit()
            raise ValueError(f"Failed to restore backup: {e}")

    async def cleanup_expired_backups(self) -> int:
        """Clean up expired backups."""
        now = datetime.utcnow()
        result = await self.db.execute(
            select(Backup).where(Backup.expires_at < now)
        )
        expired_backups = result.scalars().all()

        count = 0
        for backup in expired_backups:
            # Get actual value from Column[UUID]
            backup_id = backup.id
            from uuid import UUID as UUIDType
            backup_id_val = backup_id if isinstance(backup_id, UUIDType) else UUIDType(str(backup_id))
            if await self.delete_backup(backup_id_val):
                count += 1

        return count

    async def get_backup_stats(self) -> dict:
        """Get backup statistics."""
        result = await self.db.execute(select(Backup))
        backups = result.scalars().all()

        # Get actual values from Column objects
        total_size = 0
        auto_count = 0
        manual_count = 0
        for b in backups:
            file_size_val = getattr(b, 'file_size', None)
            backup_type_val = getattr(b, 'backup_type', None)
            # Compare with actual values - handle Column types
            if file_size_val is not None:
                # Convert to int safely
                try:
                    size_int = int(file_size_val) if isinstance(file_size_val, (int, float, str)) else 0
                    total_size += size_int
                except (TypeError, ValueError):
                    pass
            if backup_type_val is not None and str(backup_type_val) == "auto":
                auto_count += 1
            if backup_type_val is not None and str(backup_type_val) == "manual":
                manual_count += 1

        return {
            "total_backups": len(backups),
            "total_size_bytes": total_size,
            "auto_backups": auto_count,
            "manual_backups": manual_count,
        }


def get_backup_service(db: AsyncSession) -> BackupService:
    """Factory function for backup service."""
    return BackupService(db)
