"""
System initialization service.
"""
from sqlalchemy.orm import Session
from app.models import Tool, ProjectTemplate
from app.utils.logger import logger


class InitializeService:
    """Service for initializing the system."""

    @staticmethod
    async def initialize_system(db: Session) -> dict:
        """
        Initialize the system with default data.

        Args:
            db: Database session

        Returns:
            Initialization status
        """
        try:
            logger.info("Starting system initialization")

            # Check if already initialized
            existing_tools = db.query(Tool).count()
            if existing_tools > 0:
                return {
                    "success": True,
                    "message": "System already initialized",
                    "already_initialized": True,
                }

            # Add default tools
            default_tools = InitializeService._get_default_tools()
            for tool_data in default_tools:
                tool = Tool(**tool_data)
                db.add(tool)

            # Add default templates
            default_templates = InitializeService._get_default_templates()
            for template_data in default_templates:
                template = ProjectTemplate(**template_data)
                db.add(template)

            db.commit()

            logger.info("System initialization completed")

            return {
                "success": True,
                "message": "System initialized successfully",
                "tools_added": len(default_tools),
                "templates_added": len(default_templates),
                "already_initialized": False,
            }

        except Exception as e:
            db.rollback()
            logger.error(f"System initialization failed: {str(e)}")
            return {
                "success": False,
                "message": f"Initialization failed: {str(e)}",
            }

    @staticmethod
    def _get_default_tools():
        """Get default tools to add."""
        return [
            {
                "name": "DuckDuckGo Search",
                "type": "langchain",
                "category": "search",
                "description": "Search the web using DuckDuckGo",
                "config": {},
            },
            {
                "name": "Wikipedia",
                "type": "langchain",
                "category": "search",
                "description": "Search Wikipedia for information",
                "config": {},
            },
            {
                "name": "Web Scraper",
                "type": "langchain",
                "category": "web",
                "description": "Scrape content from websites",
                "config": {},
            },
            {
                "name": "File Reader",
                "type": "langchain",
                "category": "file",
                "description": "Read files (TXT, CSV, PDF, DOCX)",
                "config": {},
            },
            {
                "name": "Python REPL",
                "type": "langchain",
                "category": "code",
                "description": "Execute Python code",
                "config": {},
            },
        ]

    @staticmethod
    def _get_default_templates():
        """Get default project templates."""
        return [
            {
                "name": "Research Assistant",
                "description": "A crew for researching topics and writing reports",
                "category": "research",
                "template_data": {
                    "agents": [
                        {
                            "name": "Researcher",
                            "role": "Senior Research Analyst",
                            "goal": "Conduct thorough research on given topics",
                            "backstory": "You are an experienced researcher with expertise in finding and analyzing information from various sources.",
                        },
                        {
                            "name": "Writer",
                            "role": "Technical Writer",
                            "goal": "Write clear and comprehensive reports",
                            "backstory": "You are a skilled writer who can transform research findings into well-structured reports.",
                        },
                    ],
                    "tasks": [
                        {
                            "name": "Research Task",
                            "description": "Research the topic: {topic}",
                            "expected_output": "A comprehensive research summary",
                            "agent": "Researcher",
                            "tools": ["DuckDuckGo Search", "Wikipedia"],
                        },
                        {
                            "name": "Writing Task",
                            "description": "Write a detailed report based on the research",
                            "expected_output": "A well-written report",
                            "agent": "Writer",
                            "tools": [],
                        },
                    ],
                },
            },
            {
                "name": "Content Writer",
                "description": "A crew for creating and editing content",
                "category": "content",
                "template_data": {
                    "agents": [
                        {
                            "name": "Researcher",
                            "role": "Content Researcher",
                            "goal": "Research topics for content creation",
                            "backstory": "You research topics and gather information for content.",
                        },
                        {
                            "name": "Writer",
                            "role": "Content Writer",
                            "goal": "Write engaging content",
                            "backstory": "You create compelling and engaging content.",
                        },
                        {
                            "name": "Editor",
                            "role": "Content Editor",
                            "goal": "Edit and polish content",
                            "backstory": "You refine content to perfection.",
                        },
                    ],
                    "tasks": [
                        {
                            "name": "Research",
                            "description": "Research: {topic}",
                            "agent": "Researcher",
                        },
                        {
                            "name": "Write",
                            "description": "Write content based on research",
                            "agent": "Writer",
                        },
                        {
                            "name": "Edit",
                            "description": "Edit and polish the content",
                            "agent": "Editor",
                        },
                    ],
                },
            },
        ]

    @staticmethod
    async def check_initialization_status(db: Session) -> dict:
        """
        Check if system is initialized.

        Args:
            db: Database session

        Returns:
            Initialization status
        """
        tools_count = db.query(Tool).count()
        templates_count = db.query(ProjectTemplate).count()

        is_initialized = tools_count > 0 and templates_count > 0

        return {
            "is_initialized": is_initialized,
            "tools_count": tools_count,
            "templates_count": templates_count,
        }


# Singleton instance
initialize_service = InitializeService()
