"""
Common schemas.
"""
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
        }


class PaginationParams(BaseModel):
    """Pagination parameters."""

    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel):
    """Paginated response."""

    total: int
    page: int
    page_size: int
    pages: int
    items: list


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
    success: bool = False
