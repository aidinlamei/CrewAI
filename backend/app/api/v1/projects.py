"""
Projects API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db
from app.models import Project, Agent, Task
from app.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
    MessageResponse,
)

router = APIRouter()


@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    """List all projects."""
    projects = db.query(Project).all()
    return projects


@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Get project by ID."""
    from app.models import Execution
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get counts
    agents_count = db.query(Agent).filter(Agent.project_id == project_id).count()
    tasks_count = db.query(Task).filter(Task.project_id == project_id).count()
    executions_count = db.query(Execution).filter(Execution.project_id == project_id).count()

    # Create response
    response = ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        agents_count=agents_count,
        tasks_count=tasks_count,
        executions_count=executions_count,
    )

    return response


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID, project: ProjectUpdate, db: Session = Depends(get_db)
):
    """Update a project."""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update fields
    update_data = project.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/{project_id}", response_model=MessageResponse)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    """Delete a project."""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()

    return MessageResponse(message="Project deleted successfully")
