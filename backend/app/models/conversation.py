"""Conversation model."""

from sqlalchemy import Column, String, Text, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Conversation(BaseModel):
    """Conversation model for AI chat history."""

    __tablename__ = "conversations"

    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(64), nullable=False, index=True)
    messages = Column(JSON, default=list, nullable=False)  # Array of messages
    model = Column(String(100), nullable=True)
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="conversations")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "session_id": self.session_id,
            "messages": self.messages,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "created_at": self.created_at.isoformat() if self.created_at is not None else None,  # type: ignore
        }
