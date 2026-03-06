"""Chat API routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.conversation import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    ConversationCreate,
)
from app.services.conversation_service import get_conversation_service
from app.services.ai_service import get_ai_service

router = APIRouter()


@router.post("/project/{project_id}", response_model=ChatResponse)
async def send_message(
    project_id: UUID,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a chat message."""
    conversation_service = get_conversation_service(db)
    ai_service = get_ai_service(db)

    # Get or create session
    conversation, session_id = await conversation_service.get_or_create_session(
        project_id, request.session_id
    )

    # Get conversation history
    conversation_history = list(conversation.messages) if conversation.messages else []

    # Generate AI response
    request.session_id = session_id
    response = await ai_service.chat(request, conversation_history)

    # Save messages
    conv_id = conversation.id
    await conversation_service.add_message(
        conv_id, "user", request.message
    )
    await conversation_service.add_message(
        conv_id, "assistant", response.message.content,
        completion_tokens=len(response.message.content) // 4
    )

    return response


@router.get("/project/{project_id}/history", response_model=List[ConversationResponse])
async def get_chat_history(
    project_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get chat history for a project."""
    service = get_conversation_service(db)
    return await service.get_conversations(project_id, skip, limit)


@router.get("/session/{session_id}", response_model=ConversationResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific chat session."""
    service = get_conversation_service(db)
    conversation = await service.get_conversation_by_session_id(session_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Session not found")
    return conversation


@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a chat session."""
    service = get_conversation_service(db)
    conversation = await service.get_conversation_by_session_id(session_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Session not found")
    await service.delete_conversation(conversation.id)
    return None


@router.post("/project/{project_id}/stream")
async def send_message_stream(
    project_id: UUID,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a chat message with streaming response."""
    import json

    conversation_service = get_conversation_service(db)
    ai_service = get_ai_service(db)

    # Get or create session
    conversation, session_id = await conversation_service.get_or_create_session(
        project_id, request.session_id
    )

    # Get conversation history
    conversation_history = list(conversation.messages) if conversation.messages else []

    # Save user message first
    conv_id = conversation.id
    await conversation_service.add_message(conv_id, "user", request.message)

    async def generate():
        full_response = ""
        try:
            async for chunk in ai_service.chat_stream(request, conversation_history):
                # Parse the chunk and forward
                yield f"data: {chunk}\n\n"
                # Accumulate full response
                try:
                    parsed = json.loads(chunk)
                    if parsed.get("type") == "chunk":
                        full_response += parsed.get("content", "")
                except json.JSONDecodeError:
                    pass

            # Save assistant message after completion
            if full_response:
                await conversation_service.add_message(
                    conv_id, "assistant", full_response,
                    completion_tokens=len(full_response) // 4
                )

            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f'data: {{"type": "error", "content": "{str(e)[:100]}"}}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
