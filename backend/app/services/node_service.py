"""Node service layer."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.node import Node
from app.models.project import Project
from app.schemas.node import NodeCreate, NodeUpdate


class NodeService:
    """Node business logic service."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_nodes_by_project(self, project_id: UUID) -> List[Node]:
        """Get all nodes for a project."""
        result = await self.db.execute(
            select(Node)
            .where(Node.project_id == project_id)
            .order_by(Node.path, Node.order_index)
        )
        return result.scalars().all()

    async def get_node_by_id(self, node_id: UUID) -> Optional[Node]:
        """Get node by ID."""
        result = await self.db.execute(
            select(Node)
            .where(Node.id == node_id)
            .options(selectinload(Node.children))
        )
        return result.scalar_one_or_none()

    async def create_node(self, node_data: NodeCreate) -> Node:
        """Create a new node."""
        node = Node(
            project_id=node_data.project_id,
            parent_id=node_data.parent_id,
            path=node_data.path,
            title=node_data.title,
            content=node_data.content or {},
            node_type=node_data.node_type,
            order_index=node_data.order_index,
        )
        self.db.add(node)
        await self.db.commit()
        await self.db.refresh(node)
        return node

    async def update_node(self, node_id: UUID, node_data: NodeUpdate) -> Optional[Node]:
        """Update a node."""
        node = await self.get_node_by_id(node_id)
        if not node:
            return None

        update_data = node_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(node, field, value)

        await self.db.commit()
        await self.db.refresh(node)
        return node

    async def delete_node(self, node_id: UUID) -> bool:
        """Delete a node and its children."""
        node = await self.get_node_by_id(node_id)
        if not node:
            return False

        await self.db.delete(node)
        await self.db.commit()
        return True

    async def get_tree_structure(self, project_id: UUID) -> List[Node]:
        """Get hierarchical tree structure for a project."""
        nodes = await self.get_nodes_by_project(project_id)
        return self._build_tree(nodes)

    def _build_tree(self, nodes: List[Node]) -> List[Node]:
        """Build tree structure from flat node list."""
        node_map = {node.id: node for node in nodes}
        root_nodes = []

        for node in nodes:
            node.children = []
            if node.parent_id is None:
                root_nodes.append(node)
            elif node.parent_id in node_map:
                parent = node_map[node.parent_id]
                if not hasattr(parent, 'children'):
                    parent.children = []
                parent.children.append(node)

        return root_nodes

    async def move_node(
        self, node_id: UUID, new_parent_id: Optional[UUID], new_order_index: int
    ) -> Optional[Node]:
        """Move node to new parent and position."""
        node = await self.get_node_by_id(node_id)
        if not node:
            return None

        node.parent_id = new_parent_id
        node.order_index = new_order_index

        await self.db.commit()
        await self.db.refresh(node)
        return node

    async def get_root_nodes(self, project_id: UUID) -> List[Node]:
        """Get root level nodes for a project."""
        result = await self.db.execute(
            select(Node)
            .where(Node.project_id == project_id, Node.parent_id.is_(None))
            .order_by(Node.order_index)
            .options(selectinload(Node.children))
        )
        return list(result.scalars().all())

    async def get_node_children(self, node_id: UUID) -> List[Node]:
        """Get children nodes for a specific node."""
        result = await self.db.execute(
            select(Node)
            .where(Node.parent_id == node_id)
            .order_by(Node.order_index)
            .options(selectinload(Node.children))
        )
        return list(result.scalars().all())


def get_node_service(db: AsyncSession) -> NodeService:
    """Factory function for node service."""
    return NodeService(db)
