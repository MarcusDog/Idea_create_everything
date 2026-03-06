"""Node API routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.node import NodeCreate, NodeUpdate, NodeResponse, TreeStructureResponse
from app.services.node_service import get_node_service

router = APIRouter()


@router.get("/project/{project_id}", response_model=List[NodeResponse])
async def get_nodes_by_project(
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get all nodes for a project."""
    service = get_node_service(db)
    nodes = await service.get_nodes_by_project(project_id)
    return nodes[skip:skip + limit]


@router.get("/project/{project_id}/tree", response_model=TreeStructureResponse)
async def get_tree_structure(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get tree structure for a project."""
    service = get_node_service(db)
    nodes = await service.get_tree_structure(project_id)
    root_nodes = await service.get_root_nodes(project_id)
    all_nodes = await service.get_nodes_by_project(project_id)
    return TreeStructureResponse(
        project_id=project_id,
        root_nodes=root_nodes,
        total_nodes=len(all_nodes)
    )


@router.post("/", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    node: NodeCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new node."""
    service = get_node_service(db)
    return await service.create_node(node)


@router.get("/{node_id}", response_model=NodeResponse)
async def get_node(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a node by ID."""
    service = get_node_service(db)
    node = await service.get_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.put("/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: UUID,
    node: NodeUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a node."""
    service = get_node_service(db)
    updated = await service.update_node(node_id, node)
    if not updated:
        raise HTTPException(status_code=404, detail="Node not found")
    return updated


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a node."""
    service = get_node_service(db)
    deleted = await service.delete_node(node_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Node not found")
    return None


@router.post("/{node_id}/move", response_model=NodeResponse)
async def move_node(
    node_id: UUID,
    new_parent_id: Optional[UUID] = None,
    new_order_index: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Move a node to new parent or position."""
    service = get_node_service(db)
    moved = await service.move_node(node_id, new_parent_id, new_order_index)
    if not moved:
        raise HTTPException(status_code=404, detail="Node not found or move failed")
    return moved
