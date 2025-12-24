"""
Tool service for managing and executing tools.
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models import Tool
from app.utils.logger import logger
from app.utils.exceptions import ToolExecutionError, ValidationError
from app.utils.validators import validate_python_code


class ToolService:
    """Service for managing tools."""

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

    @staticmethod
    def execute_tool(
        tool: Tool,
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute a tool (placeholder for actual implementation).

        Args:
            tool: Tool to execute
            parameters: Tool parameters

        Returns:
            Execution result

        Raises:
            ToolExecutionError: If execution fails
        """
        try:
            # This is a placeholder - actual implementation would:
            # 1. Load the appropriate tool (LangChain, custom, etc.)
            # 2. Execute with parameters
            # 3. Return results

            if tool.type == "custom":
                # Execute custom Python code
                # WARNING: This should be sandboxed in production
                logger.warning("Custom tool execution not fully implemented")
                return {"result": "Custom tool execution placeholder"}

            elif tool.type == "langchain":
                # Execute LangChain tool
                logger.warning("LangChain tool execution not fully implemented")
                return {"result": "LangChain tool execution placeholder"}

            elif tool.type == "built-in":
                # Execute built-in tool
                logger.warning("Built-in tool execution not fully implemented")
                return {"result": "Built-in tool execution placeholder"}

            else:
                raise ToolExecutionError(f"Unknown tool type: {tool.type}")

        except Exception as e:
            logger.error(f"Tool execution failed: {str(e)}")
            raise ToolExecutionError(f"Tool execution failed: {str(e)}")

    @staticmethod
    def get_tool_categories(db: Session) -> List[str]:
        """Get list of all tool categories."""
        categories = db.query(Tool.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]


# Singleton instance
tool_service = ToolService()
