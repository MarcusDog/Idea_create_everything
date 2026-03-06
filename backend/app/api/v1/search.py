"""Search API routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.search_service import get_search_service

router = APIRouter()


@router.get("/")
async def search(
    q: str,
    entity_types: Optional[List[str]] = None,
    project_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Search for information across all entities."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    service = get_search_service(db)

    # If project_id is specified, search within that project
    if project_id:
        results = {
            "nodes": await service.search_nodes(project_id, q, skip, limit),
            "conversations": await service.search_conversations(project_id, q, skip, limit),
        }
    else:
        # Global search
        results = await service.global_search(q, entity_types, skip, limit)

    return {"query": q, "results": results, "total": sum(len(v) for v in results.values())}


@router.get("/suggest")
async def get_suggestions(
    q: str,
    project_id: Optional[UUID] = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """Get search suggestions based on partial query."""
    if not q or len(q) < 1:
        return {"suggestions": []}

    service = get_search_service(db)
    suggestions = await service.get_search_suggestions(q, project_id, limit)
    return {"query": q, "suggestions": suggestions}


@router.get("/recent")
async def get_recent_searches(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """Get recent search queries."""
    service = get_search_service(db)
    searches = await service.get_recent_searches(limit)
    return {"searches": searches}


@router.delete("/cache")
async def clear_cache(
    db: AsyncSession = Depends(get_db),
):
    """Clear search cache."""
    # TODO: Implement cache clearing with Redis
    return {"message": "Search cache cleared"}


@router.get("/projects/{project_id}")
async def search_project_nodes(
    project_id: UUID,
    q: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Search nodes within a specific project."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    service = get_search_service(db)
    nodes = await service.search_nodes(project_id, q, skip, limit)
    return {"query": q, "nodes": nodes, "total": len(nodes)}


@router.get("/web")
async def web_search(
    q: str,
    count: int = 10,
    freshness: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Search the web using BraveSearch API.

    Args:
        q: Search query
        count: Number of results (1-20)
        freshness: Filter by freshness (pd=past day, pw=past week, pm=past month)
    """
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    service = get_search_service(db)
    results = await service.web_search(q, count, freshness)

    if "error" in results and results.get("results") == []:
        raise HTTPException(status_code=503, detail=results["error"])

    return results


@router.get("/market")
async def search_market_info(
    domain: str,
    topic: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Search for market information related to a domain/topic.

    Args:
        domain: Business domain (e.g., "化妆品", "软件开发")
        topic: Specific topic to research
    """
    if not domain or not topic:
        raise HTTPException(status_code=400, detail="Domain and topic are required")

    service = get_search_service(db)
    results = await service.search_market_info(domain, topic)
    return results
