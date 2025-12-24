"""
Tasks API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate, TaskResponse, MessageResponse

router = APIRouter()


@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
def list_tasks(project_id: UUID, db: Session = Depends(get_db)):
    """List all tasks in a project."""
    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.order_index)
        .all()
    )
    return tasks


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
def create_task(project_id: UUID, task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    task_data = task.model_dump()
    task_data["project_id"] = project_id
    db_task = Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: UUID, db: Session = Depends(get_db)):
    """Get task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: UUID, task: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/tasks/{task_id}", response_model=MessageResponse)
def delete_task(task_id: UUID, db: Session = Depends(get_db)):
    """Delete a task."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()

    return MessageResponse(message="Task deleted successfully")
