"""AI service API routes."""

from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.ai_service import get_ai_service

router = APIRouter()


@router.post("/analyze/{project_id}")
async def analyze_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Analyze project and provide structured insights."""
    service = get_ai_service(db)

    # Get project data
    from app.services.project_service import get_project_service
    project_service = get_project_service(db)
    project = await project_service.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Analyze the idea
    analysis = await service.analyze_idea(project.description or "")
    return analysis


@router.post("/expand/{node_id}")
async def expand_node(
    node_id: UUID,
    context: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Expand a tree node with AI suggestions."""
    from app.services.node_service import get_node_service

    service = get_ai_service(db)
    node_service = get_node_service(db)

    node = await node_service.get_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    expansion = await service.expand_node(
        node.title, node.description or "", context
    )
    return expansion


@router.post("/suggest/{project_id}")
async def suggest_improvements(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Suggest improvements for a project."""
    from app.services.project_service import get_project_service
    from app.services.node_service import get_node_service

    service = get_ai_service(db)
    project_service = get_project_service(db)
    node_service = get_node_service(db)

    project = await project_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get project nodes
    nodes = await node_service.get_tree_structure(project_id)

    project_data = {
        "name": project.name,
        "description": project.description,
        "tree": nodes,
    }

    suggestions = await service.suggest_improvements(project_data)
    return {"suggestions": suggestions}


@router.get("/models")
async def get_models(
    db: AsyncSession = Depends(get_db),
):
    """Get available AI models."""
    # Return list of supported models
    return {
        "models": [
            {
                "id": "nvidia/moonshotai/kimi-k2.5",
                "name": "Kimi K2.5",
                "provider": "nvidia",
                "max_tokens": 200000,
            },
            {
                "id": "gpt-4",
                "name": "GPT-4",
                "provider": "openai",
                "max_tokens": 8192,
            },
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "provider": "openai",
                "max_tokens": 4096,
            },
        ]
    }


@router.post("/generate")
async def generate_text(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.7,
    max_tokens: int = 2000,
    db: AsyncSession = Depends(get_db),
):
    """Generate text from prompt."""
    service = get_ai_service(db)
    try:
        result = await service.generate_text(
            prompt, system_prompt, temperature=temperature, max_tokens=max_tokens
        )
        return {"generated_text": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
