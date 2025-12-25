"""
CrewAI orchestration service.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from crewai import Agent as CrewAgent, Task as CrewTask, Crew, Process
from app.models import Project, Agent, Task, LLMProvider
from app.services.llm_service import llm_service
from app.services.encryption_service import encryption_service
from app.utils.logger import logger
from app.utils.exceptions import CrewExecutionError


class CrewService:
    """Service for building and executing CrewAI crews."""

    @staticmethod
    async def build_crew(
        db: Session,
        project_id: UUID,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Crew:
        """
        Build a CrewAI crew from project configuration.

        Args:
            db: Database session
            project_id: Project ID
            input_data: Input data for the crew

        Returns:
            Built Crew instance

        Raises:
            CrewExecutionError: If crew building fails
        """
        try:
            # Get project
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise CrewExecutionError(f"Project {project_id} not found")

            # Get agents and tasks
            agents = db.query(Agent).filter(Agent.project_id == project_id).all()
            tasks = (
                db.query(Task)
                .filter(Task.project_id == project_id)
                .order_by(Task.order_index)
                .all()
            )

            if not agents:
                raise CrewExecutionError("No agents found in project")

            if not tasks:
                raise CrewExecutionError("No tasks found in project")

            # Build CrewAI agents
            crew_agents = []
            agent_map = {}

            for agent in agents:
                # Get LLM provider details and configure LLM
                llm = None
                if agent.llm_provider_id:
                    llm_provider = (
                        db.query(LLMProvider)
                        .filter(LLMProvider.id == agent.llm_provider_id)
                        .first()
                    )
                    
                    if llm_provider and llm_provider.api_key_encrypted:
                        try:
                            # Decrypt API key
                            api_key = encryption_service.decrypt(llm_provider.api_key_encrypted)
                            model_name = agent.llm_model or llm_provider.default_model
                            
                            # Configure LLM based on provider type
                            if llm_provider.name.lower() in ["openai", "gpt"]:
                                from langchain_openai import ChatOpenAI
                                llm = ChatOpenAI(
                                    model=model_name or "gpt-4",
                                    api_key=api_key,
                                    temperature=float(agent.temperature or 0.7),
                                )
                            elif llm_provider.name.lower() in ["anthropic", "claude"]:
                                from langchain_anthropic import ChatAnthropic
                                llm = ChatAnthropic(
                                    model=model_name or "claude-3-sonnet-20240229",
                                    api_key=api_key,
                                    temperature=float(agent.temperature or 0.7),
                                )
                            else:
                                # Use LiteLLM for other providers
                                logger.info(f"Using LiteLLM for provider: {llm_provider.name}")
                                
                        except Exception as e:
                            logger.error(f"Failed to configure LLM for agent {agent.name}: {str(e)}")

                # Build CrewAI agent with LLM
                agent_kwargs = {
                    "role": agent.role,
                    "goal": agent.goal,
                    "backstory": agent.backstory or "",
                    "verbose": True,
                    "allow_delegation": False,
                }
                
                # Add LLM if configured
                if llm:
                    agent_kwargs["llm"] = llm
                
                crew_agent = CrewAgent(**agent_kwargs)
                crew_agents.append(crew_agent)
                agent_map[str(agent.id)] = crew_agent

                logger.info(f"Built agent: {agent.name} (LLM: {'configured' if llm else 'default'})")

            # Build CrewAI tasks
            crew_tasks = []

            for task in tasks:
                # Get assigned agent
                assigned_agent = None
                if task.agent_id and str(task.agent_id) in agent_map:
                    assigned_agent = agent_map[str(task.agent_id)]

                # Build CrewAI task
                crew_task = CrewTask(
                    description=task.description,
                    expected_output=task.expected_output or "Task completed",
                    agent=assigned_agent,
                )

                crew_tasks.append(crew_task)

                logger.info(f"Built task: {task.name}")

            # Build crew
            crew = Crew(
                agents=crew_agents,
                tasks=crew_tasks,
                process=Process.sequential,
                verbose=True,
            )

            logger.info(f"Built crew for project {project.name}")

            return crew

        except Exception as e:
            logger.error(f"Failed to build crew: {str(e)}")
            raise CrewExecutionError(f"Failed to build crew: {str(e)}")

    @staticmethod
    async def execute_crew(
        crew: Crew,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Execute a CrewAI crew.

        Args:
            crew: Crew instance
            input_data: Input data

        Returns:
            Execution result

        Raises:
            CrewExecutionError: If execution fails
        """
        try:
            logger.info("Starting crew execution")

            # Execute crew
            result = crew.kickoff(inputs=input_data or {})

            logger.info("Crew execution completed")

            return {
                "result": str(result),
                "status": "completed",
            }

        except Exception as e:
            logger.error(f"Crew execution failed: {str(e)}")
            raise CrewExecutionError(f"Crew execution failed: {str(e)}")


# Singleton instance
crew_service = CrewService()
