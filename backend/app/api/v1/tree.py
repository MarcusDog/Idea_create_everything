"""Tree API routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.node import TreeNodeResponse, TreeStructureResponse
from app.services.node_service import get_node_service
from app.services.ai_service import get_ai_service

router = APIRouter()


@router.get("/project/{project_id}/structure", response_model=TreeStructureResponse)
async def get_tree_structure(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get complete tree structure for a project."""
    if project_id.startswith('local-'):
        raise HTTPException(status_code=400, detail="Local projects are not stored in the database")

    service = get_node_service(db)
    orm_nodes = await service.get_tree_structure(project_id)
    # Convert ORM nodes to Pydantic models
    from app.schemas.node import TreeNodeResponse
    pydantic_nodes = [TreeNodeResponse.model_validate(node) for node in orm_nodes]
    return TreeStructureResponse(
        project_id=project_id,
        root_nodes=pydantic_nodes,
        total_nodes=len(pydantic_nodes)
    )


@router.get("/project/{project_id}/root", response_model=List[TreeNodeResponse])
async def get_root_nodes(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get root level nodes for a project."""
    if project_id.startswith('local-'):
        raise HTTPException(status_code=400, detail="Local projects are not stored in the database")

    service = get_node_service(db)
    nodes = await service.get_root_nodes(project_id)
    return nodes


@router.get("/node/{node_id}/children", response_model=List[TreeNodeResponse])
async def get_node_children(
    node_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get children nodes for a specific node."""
    if node_id.startswith('local-'):
        raise HTTPException(status_code=400, detail="Local nodes are not stored in the database")

    service = get_node_service(db)
    node = await service.get_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    children = await service.get_node_children(node_id)
    return children


@router.post("/optimize")
async def optimize_tree(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Optimize tree structure with AI suggestions."""
    service = get_node_service(db)
    ai_service = get_ai_service(db)

    # Get current tree structure
    nodes = await service.get_tree_structure(project_id)

    # Get AI suggestions for optimization
    suggestions = await ai_service.suggest_improvements({"tree": nodes})

    return {
        "suggestions": suggestions,
        "message": "Tree optimization suggestions generated",
    }


@router.get("/suggestions")
async def get_tree_suggestions(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get AI suggestions for expanding a node."""
    service = get_node_service(db)
    ai_service = get_ai_service(db)

    node = await service.get_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Safely get node attributes
    node_title = str(node.title) if node.title is not None else ""
    node_description = str(node.description) if node.description is not None else ""

    expansion = await ai_service.expand_node(
        node_title, node_description
    )
    return expansion


@router.post("/validate")
async def validate_tree(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Validate tree structure integrity."""
    service = get_node_service(db)
    nodes = await service.get_nodes_by_project(project_id)

    # Check for circular references
    issues = []
    node_ids = {n.id for n in nodes}

    for node in nodes:
        # Safely check parent_id
        parent_id_val = node.parent_id
        if parent_id_val is not None:
            parent_uuid = parent_id_val if isinstance(parent_id_val, UUID) else UUID(str(parent_id_val))
            if parent_uuid not in node_ids:
                node_id_val = getattr(node, 'id', None)
                issues.append({
                    "node_id": str(node_id_val) if node_id_val is not None else "",
                    "issue": "Parent node not found",
                    "parent_id": str(parent_uuid),
                })

    return {
        "is_valid": len(issues) == 0,
        "total_nodes": len(nodes),
        "issues": issues,
    }


@router.get("/export/{project_id}")
async def export_tree(
    project_id: UUID,
    format: str = "json",
    db: AsyncSession = Depends(get_db),
):
    """Export tree to various formats."""
    from app.services.project_service import get_project_service

    project_service = get_project_service(db)
    node_service = get_node_service(db)

    project = await project_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    nodes = await node_service.get_tree_structure(project_id)

    # Safely get project attributes
    project_name = str(project.name) if project.name is not None else ""
    project_description = str(project.description) if project.description is not None else ""

    # Get project id safely
    project_id_val = getattr(project, 'id', None)
    project_id_str = str(project_id_val) if project_id_val is not None else ""

    if format == "json":
        return {
            "project": {
                "id": project_id_str,
                "name": project_name,
                "description": project_description if project_description else None,
            },
            "tree": nodes,
        }
    elif format == "markdown":
        # Convert to markdown outline
        md_lines = [f"# {project_name}", ""]
        desc_val = project.description
        if desc_val is not None:
            md_lines.extend([str(desc_val), ""])

        def build_md(node, level=0):
            indent = "  " * level
            md_lines.append(f"{indent}- {node.get('title', 'Untitled')}")
            if node.get('description'):
                md_lines.append(f"{indent}  - {node.get('description')}")
            for child in node.get('children', []):
                build_md(child, level + 1)

        for node in nodes:
            build_md(node)

        return {"format": "markdown", "content": "\n".join(md_lines)}
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
