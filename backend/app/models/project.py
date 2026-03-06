"""Project model."""

from sqlalchemy import Column, String, Text, Integer, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Project(BaseModel):
    """Project model."""

    __tablename__ = "projects"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(50), nullable=True)
    tree_data = Column(JSON, default=dict, nullable=False)
    version = Column(Integer, default=1, nullable=False)

    # Relationships
    nodes = relationship("Node", back_populates="project", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "domain": self.domain,
            "tree_data": self.tree_data,
            "version": self.version,
            "created_at": self.created_at.isoformat() if hasattr(self, 'created_at') and self.created_at is not None else None,
            "updated_at": self.updated_at.isoformat() if hasattr(self, 'updated_at') and self.updated_at is not None else None,
        }
