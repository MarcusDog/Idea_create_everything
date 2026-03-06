"""Conversation schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Message(BaseModel):
    """Chat message schema."""

    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class ConversationBase(BaseModel):
    """Base conversation schema."""

    session_id: str = Field(..., min_length=1, max_length=64)
    model: Optional[str] = Field(None, max_length=100)


class ConversationCreate(ConversationBase):
    """Conversation creation schema."""

    project_id: UUID
    messages: List[Message] = Field(default_factory=list)


class ConversationUpdate(BaseModel):
    """Conversation update schema."""

    messages: Optional[List[Message]] = None
    model: Optional[str] = Field(None, max_length=100)


class ConversationResponse(ConversationBase):
    """Conversation response schema."""

    id: UUID
    project_id: UUID
    messages: List[Message]
    prompt_tokens: int
    completion_tokens: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Chat request schema."""

    message: str = Field(..., min_length=1)
    session_id: Optional[str] = Field(None, max_length=64)
    model: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Chat response schema."""

    message: Message
    session_id: str
    tokens_used: int
    model: str
