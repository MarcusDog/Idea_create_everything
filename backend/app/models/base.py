"""Base model for all database models."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, CHAR, String as StringType

from app.core.database import Base


class SQLiteUUID(TypeDecorator):
    """Platform-independent UUID type.

    Uses PostgreSQL UUID for PostgreSQL, String(36) for SQLite.
    """

    impl = StringType(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        # Use native UUID for PostgreSQL, String for others
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PostgreSQLUUID(as_uuid=False))
        else:
            return dialect.type_descriptor(StringType(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)


class BaseModel(Base):
    """Base model with common fields."""

    __abstract__ = True

    id = Column(SQLiteUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id})>"
