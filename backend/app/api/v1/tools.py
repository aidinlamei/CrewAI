"""
Tools API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.api.deps import get_db
from app.models import Tool
from app.schemas import (
    ToolCreate,
    ToolUpdate,
    ToolResponse,
    MessageResponse,
    ToolTestRequest,
    ToolTestResponse,
)
from app.services.tool_service import tool_service

router = APIRouter()


@router.get("/", response_model=List[ToolResponse])
def list_tools(
    category: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all tools."""
    tools = tool_service.list_tools(db, category=category, type=type)
    return tools


@router.get("/categories", response_model=List[str])
def get_tool_categories(db: Session = Depends(get_db)):
    """Get list of tool categories."""
    categories = tool_service.get_tool_categories(db)
    return categories


@router.post("/", response_model=ToolResponse)
def create_tool(tool: ToolCreate, db: Session = Depends(get_db)):
    """Create a new tool."""
    db_tool = Tool(**tool.model_dump())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool


@router.get("/{tool_id}", response_model=ToolResponse)
def get_tool(tool_id: UUID, db: Session = Depends(get_db)):
    """Get tool by ID."""
    tool = tool_service.get_tool(db, str(tool_id))
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.put("/{tool_id}", response_model=ToolResponse)
def update_tool(tool_id: UUID, tool: ToolUpdate, db: Session = Depends(get_db)):
    """Update a tool."""
    db_tool = tool_service.get_tool(db, str(tool_id))
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    update_data = tool.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tool, field, value)

    db.commit()
    db.refresh(db_tool)
    return db_tool


@router.delete("/{tool_id}", response_model=MessageResponse)
def delete_tool(tool_id: UUID, db: Session = Depends(get_db)):
    """Delete a tool."""
    db_tool = tool_service.get_tool(db, str(tool_id))
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    db.delete(db_tool)
    db.commit()

    return MessageResponse(message="Tool deleted successfully")


@router.post("/{tool_id}/test", response_model=ToolTestResponse)
def test_tool(
    tool_id: UUID, request: ToolTestRequest, db: Session = Depends(get_db)
):
    """Test a tool."""
    tool = tool_service.get_tool(db, str(tool_id))
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    try:
        result = tool_service.execute_tool(tool, request.parameters)
        return ToolTestResponse(success=True, result=result)
    except Exception as e:
        return ToolTestResponse(success=False, error=str(e))
