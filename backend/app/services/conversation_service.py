"""Conversation service layer."""

import uuid
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate, Message


class ConversationService:
    """Conversation business logic service."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_conversations(
        self, project_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Conversation]:
        """Get all conversations for a project."""
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.project_id == project_id)
            .order_by(Conversation.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_conversation_by_id(
        self, conversation_id: UUID
    ) -> Optional[Conversation]:
        """Get conversation by ID."""
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_conversation_by_session(
        self, project_id: UUID, session_id: str
    ) -> Optional[Conversation]:
        """Get conversation by session ID."""
        result = await self.db.execute(
            select(Conversation)
            .where(
                Conversation.project_id == project_id,
                Conversation.session_id == session_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_conversation_by_session_id(
        self, session_id: str
    ) -> Optional[Conversation]:
        """Get conversation by session ID only."""
        result = await self.db.execute(
            select(Conversation).where(Conversation.session_id == session_id)
        )
        return result.scalar_one_or_none()

    async def create_conversation(
        self, conversation_data: ConversationCreate
    ) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            project_id=conversation_data.project_id,
            session_id=conversation_data.session_id,
            messages=[msg.model_dump() for msg in conversation_data.messages],
            model=conversation_data.model,
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def get_or_create_session(
        self, project_id: UUID, session_id: Optional[str] = None
    ) -> Tuple[Conversation, str]:
        """Get existing session or create new one."""
        if session_id:
            conversation = await self.get_conversation_by_session(project_id, session_id)
            if conversation:
                return conversation, session_id

        # Create new session
        new_session_id = str(uuid.uuid4())[:16]
        conversation = Conversation(
            project_id=project_id,
            session_id=new_session_id,
            messages=[],
            model=None,
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation, new_session_id

    async def add_message(
        self,
        conversation_id: UUID,
        role: str,
        content: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
    ) -> Optional[Conversation]:
        """Add a message to conversation."""
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return None

        message = Message(role=role, content=content).model_dump()
        messages = conversation.messages or []
        messages.append(message)
        conversation.messages = messages

        conversation.prompt_tokens += prompt_tokens
        conversation.completion_tokens += completion_tokens

        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def update_conversation(
        self, conversation_id: UUID, conversation_data: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update a conversation."""
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return None

        update_data = conversation_data.model_dump(exclude_unset=True)
        if "messages" in update_data:
            update_data["messages"] = [
                msg.model_dump() if isinstance(msg, Message) else msg
                for msg in update_data["messages"]
            ]

        for field, value in update_data.items():
            setattr(conversation, field, value)

        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def delete_conversation(self, conversation_id: UUID) -> bool:
        """Delete a conversation."""
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return False

        await self.db.delete(conversation)
        await self.db.commit()
        return True

    async def get_project_sessions(self, project_id: UUID) -> List[Conversation]:
        """Get all sessions for a project."""
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.project_id == project_id)
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all())


def get_conversation_service(db: AsyncSession) -> ConversationService:
    """Factory function for conversation service."""
    return ConversationService(db)
