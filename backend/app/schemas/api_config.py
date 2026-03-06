"""API Config schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, SecretStr, field_validator


class APIConfigBase(BaseModel):
    """Base API config schema."""

    name: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(..., min_length=1, max_length=50)
    base_url: str = Field(..., min_length=1, max_length=500)
    model: str = Field(..., min_length=1, max_length=100)
    is_active: bool = Field(default=True)
    is_default: bool = Field(default=False)
    priority: int = Field(default=0, ge=0, le=100)


class APIConfigCreate(APIConfigBase):
    """API config creation schema."""

    api_key: str = Field(..., min_length=1)


class APIConfigUpdate(BaseModel):
    """API config update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    base_url: Optional[str] = Field(None, min_length=1, max_length=500)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    api_key: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=100)


class APIConfigResponse(APIConfigBase):
    """API config response schema."""

    id: UUID
    api_key_masked: str = Field(default="****")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

    @field_validator("api_key_masked", mode="before")
    @classmethod
    def mask_api_key(cls, v, info):
        """Mask API key for display."""
        if v is not None and v != "****" and len(v) > 8:
            return v[:4] + "****" + v[-4:]
        return "****"


class APIConfigListResponse(BaseModel):
    """API config list response."""

    id: UUID
    name: str
    provider: str
    model: str
    is_active: bool
    is_default: bool
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True


class APIConfigTestRequest(BaseModel):
    """API config test request."""

    id: UUID


class APIConfigTestResponse(BaseModel):
    """API config test response."""

    success: bool
    message: str
    latency_ms: Optional[int] = None
