"""
API dependencies.
"""
from typing import Generator
from app.database import SessionLocal


def get_db() -> Generator:
    """
    Get database session.

    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
