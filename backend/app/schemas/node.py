"""Node schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class NodeBase(BaseModel):
    """Base node schema."""

    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[Dict[str, Any]] = Field(default_factory=dict)
    node_type: str = Field(default="task", max_length=50)
    order_index: int = Field(default=0, ge=0)


class NodeCreate(NodeBase):
    """Node creation schema."""

    project_id: UUID
    parent_id: Optional[UUID] = None
    path: str = Field(..., max_length=500)


class NodeUpdate(BaseModel):
    """Node update schema."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[Dict[str, Any]] = None
    node_type: Optional[str] = Field(None, max_length=50)
    order_index: Optional[int] = Field(None, ge=0)
    path: Optional[str] = Field(None, max_length=500)


class NodeResponse(NodeBase):
    """Node response schema."""

    id: UUID
    project_id: UUID
    parent_id: Optional[UUID]
    path: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TreeNodeResponse(NodeResponse):
    """Tree node with children."""

    children: List["TreeNodeResponse"] = Field(default_factory=list)


class TreeStructureResponse(BaseModel):
    """Complete tree structure response."""

    project_id: UUID
    root_nodes: List[TreeNodeResponse]
    total_nodes: int
