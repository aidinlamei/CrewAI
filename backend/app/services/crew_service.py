"""
CrewAI orchestration service.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from crewai import Agent as CrewAgent, Task as CrewTask, Crew, Process
from app.models import Project, Agent, Task, LLMProvider
from app.services.llm_service import llm_service
from app.services.encryption_service import encryption_service
from app.services.tool_service import tool_service
from app.services.mem0_service import mem0_service
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

            # Get agents with eager loading of llm_provider to avoid N+1 queries
            agents = (
                db.query(Agent)
                .options(joinedload(Agent.llm_provider))
                .filter(Agent.project_id == project_id)
                .all()
            )

            # Get tasks with eager loading of agent to avoid N+1 queries
            tasks = (
                db.query(Task)
                .options(joinedload(Task.agent))
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
                # Get LLM provider details (already eager loaded via joinedload)
                llm_provider = agent.llm_provider

                # Get relevant memory context
                backstory = agent.backstory or ""
                try:
                    memory_context = mem0_service.get_relevant_context(
                        str(agent.id),
                        agent.goal,
                        limit=3
                    )
                    if memory_context:
                        backstory = f"{backstory}\n\n{memory_context}"
                except Exception as e:
                    logger.warning(f"Failed to get memory context: {str(e)}")

                # Get agent tools
                agent_tools = []
                if agent.tools:
                    for tool_id in agent.tools:
                        try:
                            executable_tool = tool_service.get_executable_tool(
                                db, str(tool_id)
                            )
                            if executable_tool:
                                agent_tools.append(executable_tool)
                        except Exception as e:
                            logger.warning(
                                f"Failed to load tool {tool_id}: {str(e)}"
                            )

                # Build CrewAI agent
                crew_agent = CrewAgent(
                    role=agent.role,
                    goal=agent.goal,
                    backstory=backstory,
                    verbose=True,
                    allow_delegation=False,
                    tools=agent_tools if agent_tools else None,
                )

                crew_agents.append(crew_agent)
                agent_map[str(agent.id)] = crew_agent

                logger.info(
                    f"Built agent: {agent.name} with {len(agent_tools)} tools"
                )

            # Build CrewAI tasks
            crew_tasks = []

            for task in tasks:
                # Get assigned agent
                assigned_agent = None
                if task.agent_id and str(task.agent_id) in agent_map:
                    assigned_agent = agent_map[str(task.agent_id)]

                # Get tools for task
                task_tools = []
                if task.tools:
                    for tool_id in task.tools:
                        try:
                            tool = tool_service.get_tool(db, tool_id)
                            if tool:
                                executable_tool = tool_service.get_executable_tool(db, tool_id)
                                task_tools.append(executable_tool)
                        except Exception as e:
                            logger.warning(f"Failed to load tool {tool_id}: {str(e)}")

                # Build CrewAI task
                crew_task = CrewTask(
                    description=task.description,
                    expected_output=task.expected_output or "Task completed",
                    agent=assigned_agent,
                    tools=task_tools if task_tools else None,
                )

                crew_tasks.append(crew_task)

                logger.info(f"Built task: {task.name} with {len(task_tools)} tools")

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
