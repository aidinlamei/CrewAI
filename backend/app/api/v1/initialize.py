"""
Initialize API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.initialize_service import initialize_service

router = APIRouter()


@router.post("/initialize")
async def initialize_system(db: Session = Depends(get_db)):
    """Initialize the system with default data."""
    result = await initialize_service.initialize_system(db)
    return result


@router.get("/initialize/status")
async def get_initialization_status(db: Session = Depends(get_db)):
    """Check if system is initialized."""
    result = await initialize_service.check_initialization_status(db)
    return result
