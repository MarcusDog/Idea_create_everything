"""Search service layer."""

import os
from typing import Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from app.models.project import Project
from app.models.node import Node
from app.models.conversation import Conversation


class SearchService:
    """Search business logic service."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_projects(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Project]:
        """Search projects by name or description."""
        search_pattern = f"%{query}%"
        result = await self.db.execute(
            select(Project)
            .where(
                or_(
                    Project.name.ilike(search_pattern),
                    Project.description.ilike(search_pattern),
                )
            )
            .order_by(Project.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def search_nodes(
        self,
        project_id: Optional[UUID],
        query: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Node]:
        """Search nodes within a project."""
        search_pattern = f"%{query}%"
        # Search title and description in database
        query_stmt = select(Node).where(
            or_(
                Node.title.ilike(search_pattern),
                Node.description.ilike(search_pattern),
            )
        )

        if project_id:
            query_stmt = query_stmt.where(Node.project_id == project_id)

        query_stmt = query_stmt.order_by(Node.updated_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query_stmt)
        nodes = result.scalars().all()

        # Also search in content JSON (if needed)
        # Return all nodes that matched title/description
        return list(nodes)

    async def search_conversations(
        self,
        project_id: UUID,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Conversation]:
        """Search conversations by message content."""
        # Note: This searches JSON content which may be slow on large datasets
        # Consider using PostgreSQL's JSONB indexing for production
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.project_id == project_id)
            .order_by(Conversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        conversations = result.scalars().all()

        # Filter by content in Python (JSON search)
        filtered = []
        query_lower = query.lower()
        for conv in conversations:
            messages = conv.messages or []
            for msg in messages:
                content = msg.get("content", "").lower()
                if query_lower in content:
                    filtered.append(conv)
                    break

        return filtered[skip:skip + limit]

    async def global_search(
        self,
        query: str,
        entity_types: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, List]:
        """Global search across all entities."""
        entity_types = entity_types or ["projects", "nodes", "conversations"]
        results = {}

        if "projects" in entity_types:
            results["projects"] = await self.search_projects(query, skip, limit)

        if "nodes" in entity_types:
            results["nodes"] = await self.search_nodes(None, query, skip, limit)

        if "conversations" in entity_types:
            # For conversations, search across all projects
            # Note: This may be slow for large datasets
            results["conversations"] = []

        return results

    async def get_search_suggestions(
        self,
        query: str,
        project_id: Optional[UUID] = None,
        limit: int = 10,
    ) -> List[str]:
        """Get search suggestions based on partial query."""
        if len(query) < 2:
            return []

        search_pattern = f"%{query}%"
        suggestions = set()

        # Get project name suggestions
        if not project_id:
            result = await self.db.execute(
                select(Project.name)
                .where(Project.name.ilike(search_pattern))
                .limit(limit)
            )
            suggestions.update(name for name in result.scalars().all() if name)

        # Get node title suggestions
        node_query = select(Node.title).where(Node.title.ilike(search_pattern))
        if project_id:
            node_query = node_query.where(Node.project_id == project_id)
        node_query = node_query.limit(limit)
        result = await self.db.execute(node_query)
        suggestions.update(title for title in result.scalars().all() if title)

        return list(suggestions)[:limit]

    async def get_recent_searches(self, limit: int = 10) -> List[str]:
        """Get recent search queries (from cache if available)."""
        # TODO: Implement with Redis cache
        return []

    async def save_search_query(self, query: str):
        """Save search query for suggestions."""
        # TODO: Implement with Redis cache
        pass

    async def web_search(
        self,
        query: str,
        count: int = 10,
        freshness: Optional[str] = None,
    ) -> Dict:
        """
        Search the web using BraveSearch API.

        Args:
            query: Search query
            count: Number of results (max 20)
            freshness: Filter by freshness (pd=past day, pw=past week, pm=past month)

        Returns:
            Search results with web pages, descriptions, and URLs
        """
        api_key = os.getenv("BRAVE_API_KEY")
        if not api_key:
            return {
                "error": "BraveSearch API key not configured",
                "results": [],
                "query": query,
            }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "q": query,
                    "count": min(count, 20),
                }
                if freshness:
                    params["freshness"] = freshness

                response = await client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    headers={
                        "Accept": "application/json",
                        "X-Subscription-Token": api_key,
                    },
                    params=params,
                )
                response.raise_for_status()
                data = response.json()

                # Extract relevant results
                web_results = data.get("web", {}).get("results", [])
                results = []
                for item in web_results:
                    results.append({
                        "title": item.get("title", ""),
                        "description": item.get("description", ""),
                        "url": item.get("url", ""),
                        "age": item.get("age", ""),
                    })

                return {
                    "query": query,
                    "results": results,
                    "total": len(results),
                }

        except httpx.HTTPStatusError as e:
            return {
                "error": f"Search API error: {e.response.status_code}",
                "results": [],
                "query": query,
            }
        except Exception as e:
            return {
                "error": f"Search failed: {str(e)[:100]}",
                "results": [],
                "query": query,
            }

    async def search_market_info(self, domain: str, topic: str) -> Dict:
        """
        Search for market information related to a domain/topic.

        Args:
            domain: Business domain (e.g., "化妆品", "软件开发")
            topic: Specific topic to research

        Returns:
            Market insights and relevant information
        """
        queries = [
            f"{domain} {topic} 市场分析 2024",
            f"{domain} 行业趋势",
            f"{topic} 竞品分析",
        ]

        all_results = []
        for query in queries:
            result = await self.web_search(query, count=5)
            if "results" in result:
                all_results.extend(result["results"])

        return {
            "domain": domain,
            "topic": topic,
            "results": all_results[:15],  # Limit to 15 results
            "total": len(all_results),
        }


def get_search_service(db: AsyncSession) -> SearchService:
    """Factory function for search service."""
    return SearchService(db)
