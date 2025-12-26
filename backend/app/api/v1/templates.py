"""
Templates API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db
from app.models import ProjectTemplate, Project, Agent, Task
from app.schemas.common import MessageResponse
from pydantic import BaseModel

router = APIRouter()


class TemplateResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    category: str | None
    template_data: dict
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class UseTemplateRequest(BaseModel):
    name: str


class UseTemplateResponse(BaseModel):
    project_id: UUID
    message: str


@router.get("/", response_model=List[TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    """List all templates."""
    templates = db.query(ProjectTemplate).filter(ProjectTemplate.is_active == True).all()
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            template_data=t.template_data or {},
            is_active=t.is_active,
            created_at=t.created_at.isoformat(),
        )
        for t in templates
    ]


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: UUID, db: Session = Depends(get_db)):
    """Get template by ID."""
    template = db.query(ProjectTemplate).filter(ProjectTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        template_data=template.template_data or {},
        is_active=template.is_active,
        created_at=template.created_at.isoformat(),
    )


@router.post("/{template_id}/use", response_model=UseTemplateResponse)
def use_template(
    template_id: UUID,
    request: UseTemplateRequest,
    db: Session = Depends(get_db),
):
    """Create a project from a template."""
    template = db.query(ProjectTemplate).filter(ProjectTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Create project
    project = Project(name=request.name, description=template.description)
    db.add(project)
    db.flush()  # Get project ID

    # Create agents from template
    template_data = template.template_data or {}
    agent_map = {}  # Map template agent names to created agent IDs

    for agent_data in template_data.get("agents", []):
        agent = Agent(
            project_id=project.id,
            name=agent_data.get("name", "Agent"),
            role=agent_data.get("role", "Agent"),
            goal=agent_data.get("goal", "Complete tasks"),
            backstory=agent_data.get("backstory", ""),
        )
        db.add(agent)
        db.flush()
        agent_map[agent_data.get("name")] = agent.id

    # Create tasks from template
    for idx, task_data in enumerate(template_data.get("tasks", [])):
        agent_name = task_data.get("agent")
        agent_id = agent_map.get(agent_name) if agent_name else None

        task = Task(
            project_id=project.id,
            agent_id=agent_id,
            name=task_data.get("name", "Task"),
            description=task_data.get("description", "Task description"),
            expected_output=task_data.get("expected_output", ""),
            order_index=idx,
            tools=task_data.get("tools", []),
        )
        db.add(task)

    db.commit()

    return UseTemplateResponse(
        project_id=project.id,
        message="Project created from template successfully",
    )
