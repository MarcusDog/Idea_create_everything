"""Backup model."""

from sqlalchemy import Column, String, Text, BigInteger, ForeignKey, DateTime

from app.models.base import BaseModel


class Backup(BaseModel):
    """Backup record model."""

    __tablename__ = "backups"

    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    backup_type = Column(String(50), default="auto", nullable=False)  # auto, manual, crash
    status = Column(String(50), default="success", nullable=False)  # success, failed, pending
    error_message = Column(Text, nullable=True)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "project_id": str(self.project_id) if self.project_id else None,
            "name": self.name,
            "description": self.description,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "backup_type": self.backup_type,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
