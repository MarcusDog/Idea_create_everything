"""Node model for tree structure."""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Node(BaseModel):
    """Node model for tree structure."""

    __tablename__ = "nodes"

    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(String(36), ForeignKey("nodes.id"), nullable=True)
    path = Column(String(500), nullable=False, index=True)  # Materialized path
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(JSON, default=dict, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    node_type = Column(String(50), default="task", nullable=False)  # task, milestone, resource, etc.

    # Relationships
    project = relationship("Project", back_populates="nodes")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        # Get actual values from Column objects by checking for None
        parent_id_val = self.parent_id
        # Safely convert values to avoid Column type issues
        parent_id_str = None
        if parent_id_val is not None:
            parent_id_str = str(parent_id_val)

        created_at_val = self.created_at
        created_at_str = None
        if created_at_val is not None:
            created_at_str = created_at_val.isoformat() if hasattr(created_at_val, 'isoformat') else str(created_at_val)

        updated_at_val = self.updated_at
        updated_at_str = None
        if updated_at_val is not None:
            updated_at_str = updated_at_val.isoformat() if hasattr(updated_at_val, 'isoformat') else str(updated_at_val)

        return {
            "id": str(self.id) if self.id is not None else None,
            "project_id": str(self.project_id) if self.project_id is not None else None,
            "parent_id": parent_id_str,
            "path": str(self.path) if self.path is not None else "",
            "title": str(self.title) if self.title is not None else "",
            "description": str(self.description) if self.description is not None else None,
            "content": self.content,
            "order_index": int(self.order_index) if self.order_index is not None else 0,  # type: ignore
            "node_type": str(self.node_type) if self.node_type is not None else "task",
            "created_at": created_at_str,
            "updated_at": updated_at_str,
        }
