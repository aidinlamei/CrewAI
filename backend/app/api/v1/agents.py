"""
Agents API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db
from app.models import Agent
from app.schemas import AgentCreate, AgentUpdate, AgentResponse, MessageResponse

router = APIRouter()


@router.get("/projects/{project_id}/agents", response_model=List[AgentResponse])
def list_agents(project_id: UUID, db: Session = Depends(get_db)):
    """List all agents in a project."""
    agents = db.query(Agent).filter(Agent.project_id == project_id).all()
    return agents


@router.post("/projects/{project_id}/agents", response_model=AgentResponse)
def create_agent(
    project_id: UUID, agent: AgentCreate, db: Session = Depends(get_db)
):
    """Create a new agent."""
    agent_data = agent.model_dump()
    agent_data["project_id"] = project_id
    db_agent = Agent(**agent_data)
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.get("/agents/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: UUID, db: Session = Depends(get_db)):
    """Get agent by ID."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/agents/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: UUID, agent: AgentUpdate, db: Session = Depends(get_db)):
    """Update an agent."""
    db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = agent.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_agent, field, value)

    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.delete("/agents/{agent_id}", response_model=MessageResponse)
def delete_agent(agent_id: UUID, db: Session = Depends(get_db)):
    """Delete an agent."""
    db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    db.delete(db_agent)
    db.commit()

    return MessageResponse(message="Agent deleted successfully")
