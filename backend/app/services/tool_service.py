"""
Tool service for managing and executing tools.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models import Tool
from app.utils.logger import logger
from app.utils.exceptions import ToolExecutionError, ValidationError
from app.utils.validators import validate_python_code

# Import LangChain tools
try:
    from langchain.tools import DuckDuckGoSearchRun
    from langchain_community.utilities import WikipediaAPIWrapper
    from langchain.tools import WikipediaQueryRun
    LANGCHAIN_AVAILABLE = True
except ImportError:
    logger.warning("LangChain tools not available")
    LANGCHAIN_AVAILABLE = False


class ToolService:
    """Service for managing tools."""

    def __init__(self):
        """Initialize tool service with LangChain tools."""
        self.langchain_tools = {}
        if LANGCHAIN_AVAILABLE:
            try:
                self.langchain_tools['duckduckgo_search'] = DuckDuckGoSearchRun()
                self.langchain_tools['wikipedia'] = WikipediaQueryRun(
                    api_wrapper=WikipediaAPIWrapper()
                )
                logger.info("LangChain tools initialized")
            except Exception as e:
                logger.error(f"Failed to initialize LangChain tools: {e}")

    @staticmethod
    def get_tool(db: Session, tool_id: str) -> Optional[Tool]:
        """Get tool by ID."""
        return db.query(Tool).filter(Tool.id == tool_id).first()

    @staticmethod
    def get_tool_by_name(db: Session, name: str) -> Optional[Tool]:
        """Get tool by name."""
        return db.query(Tool).filter(Tool.name == name).first()

    @staticmethod
    def list_tools(
        db: Session,
        category: Optional[str] = None,
        type: Optional[str] = None,
        is_active: bool = True,
    ) -> List[Tool]:
        """List all tools."""
        query = db.query(Tool)

        if category:
            query = query.filter(Tool.category == category)

        if type:
            query = query.filter(Tool.type == type)

        if is_active is not None:
            query = query.filter(Tool.is_active == is_active)

        return query.all()

    @staticmethod
    def create_custom_tool(
        db: Session,
        name: str,
        description: str,
        python_code: str,
        category: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> Tool:
        """
        Create a custom tool.

        Args:
            db: Database session
            name: Tool name
            description: Tool description
            python_code: Python code for the tool
            category: Tool category
            config: Tool configuration

        Returns:
            Created tool

        Raises:
            ValidationError: If Python code is invalid
        """
        # Validate Python code
        if not validate_python_code(python_code):
            raise ValidationError("Invalid Python code syntax")

        tool = Tool(
            name=name,
            type="custom",
            category=category,
            description=description,
            python_code=python_code,
            config=config or {},
            is_active=True,
        )

        db.add(tool)
        db.commit()
        db.refresh(tool)

        logger.info(f"Created custom tool: {name}")
        return tool

    def execute_tool(
        self,
        tool: Tool,
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute a tool with given parameters.

        Args:
            tool: Tool to execute
            parameters: Tool parameters

        Returns:
            Execution result
        """
        try:
            logger.info(f"Executing tool: {tool.name} (type: {tool.type})")

            if tool.type == "langchain":
                return self._execute_langchain_tool(tool, parameters)
            elif tool.type == "custom":
                return self._execute_custom_tool(tool, parameters)
            elif tool.type == "built-in":
                return self._execute_builtin_tool(tool, parameters)
            else:
                raise ToolExecutionError(f"Unknown tool type: {tool.type}")

        except Exception as e:
            logger.error(f"Tool execution failed: {str(e)}")
            raise ToolExecutionError(f"Tool execution failed: {str(e)}")

    def _execute_langchain_tool(self, tool: Tool, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a LangChain tool."""
        if not LANGCHAIN_AVAILABLE:
            raise ToolExecutionError("LangChain tools not available")

        # Map tool names to internal keys
        tool_map = {
            'DuckDuckGo Search': 'duckduckgo_search',
            'Wikipedia': 'wikipedia',
        }

        tool_key = tool_map.get(tool.name)
        if not tool_key or tool_key not in self.langchain_tools:
            raise ToolExecutionError(f"LangChain tool not found: {tool.name}")

        langchain_tool = self.langchain_tools[tool_key]

        # Get query parameter
        query = parameters.get('query') or parameters.get('input') or parameters.get('q')
        if not query:
            raise ToolExecutionError("Query parameter required (use 'query', 'input', or 'q')")

        # Execute
        result = langchain_tool.run(query)

        return {
            "success": True,
            "result": result,
            "tool": tool.name,
        }

    def _execute_custom_tool(self, tool: Tool, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a custom Python tool."""
        if not tool.python_code:
            raise ToolExecutionError("No Python code defined for custom tool")

        try:
            namespace = {'parameters': parameters}
            exec(tool.python_code, namespace)

            # Look for callable
            if tool.name in namespace and callable(namespace[tool.name]):
                result = namespace[tool.name](**parameters)
            elif 'run' in namespace and callable(namespace['run']):
                result = namespace['run'](**parameters)
            else:
                raise ToolExecutionError("No callable function found")

            return {
                "success": True,
                "result": result,
                "tool": tool.name,
            }

        except Exception as e:
            raise ToolExecutionError(f"Custom tool execution failed: {str(e)}")

    def _execute_builtin_tool(self, tool: Tool, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a built-in tool."""
        # For now, return a placeholder
        # In the future, implement actual built-in tools
        return {
            "success": True,
            "result": f"Built-in tool {tool.name} executed",
            "tool": tool.name,
        }

    @staticmethod
    def get_tool_categories(db: Session) -> List[str]:
        """Get list of all tool categories."""
        categories = db.query(Tool.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]


# Singleton instance
tool_service = ToolService()
