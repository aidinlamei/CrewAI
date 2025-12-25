"""API v1 package."""
from fastapi import APIRouter
from app.api.v1 import (
    initialize, projects, agents, tasks, tools, 
    llm_providers, executions, templates, memory, token_usage
)

api_router = APIRouter()

# Include routers
api_router.include_router(initialize.router, prefix="", tags=["initialize"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(agents.router, prefix="", tags=["agents"])
api_router.include_router(tasks.router, prefix="", tags=["tasks"])
api_router.include_router(tools.router, prefix="/tools", tags=["tools"])
api_router.include_router(
    llm_providers.router, prefix="/llm-providers", tags=["llm-providers"]
)
api_router.include_router(executions.router, prefix="", tags=["executions"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(memory.router, prefix="", tags=["memory"])
api_router.include_router(token_usage.router, prefix="", tags=["token-usage"])
