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
        Execute a tool.

        Args:
            tool: Tool to execute
            parameters: Tool parameters

        Returns:
            Execution result

        Raises:
            ToolExecutionError: If execution fails
        """
        try:
            # SECURITY: Disable custom code execution until sandbox is implemented
            if tool.type == "custom":
                logger.warning(f"Custom tool execution blocked for security: {tool.name}")
                raise ToolExecutionError(
                    "Custom tool execution is temporarily disabled for security reasons. "
                    "Please use built-in tools or contact administrator."
                )

            elif tool.type == "langchain":
                # Execute LangChain tool with safety checks
                return ToolService._execute_langchain_tool(tool, parameters)

            elif tool.type == "built-in":
                # Execute built-in tool
                return ToolService._execute_builtin_tool(tool, parameters)

            else:
                raise ToolExecutionError(f"Unknown tool type: {tool.type}")

        except ToolExecutionError:
            raise
        except Exception as e:
            logger.error(f"Tool execution failed: {str(e)}")
            raise ToolExecutionError(f"Tool execution failed: {str(e)}")
    
    @staticmethod
    def _execute_builtin_tool(tool: Tool, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a built-in tool safely."""
        try:
            tool_name = tool.name.lower()
            
            if tool_name == "web_search":
                query = parameters.get("query", "")
                if not query:
                    return {"success": False, "error": "Query parameter required"}
                # Use DuckDuckGo search
                try:
                    from duckduckgo_search import DDGS
                    with DDGS() as ddgs:
                        results = list(ddgs.text(query, max_results=5))
                    return {"success": True, "result": results}
                except ImportError:
                    return {"success": False, "error": "Search module not available"}
                    
            elif tool_name == "wikipedia":
                query = parameters.get("query", "")
                if not query:
                    return {"success": False, "error": "Query parameter required"}
                try:
                    import wikipedia
                    summary = wikipedia.summary(query, sentences=3)
                    return {"success": True, "result": summary}
                except ImportError:
                    return {"success": False, "error": "Wikipedia module not available"}
                except Exception as e:
                    return {"success": False, "error": str(e)}
            
            else:
                return {
                    "success": False,
                    "error": f"Built-in tool '{tool.name}' not implemented yet"
                }
                
        except Exception as e:
            logger.error(f"Built-in tool execution error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def _execute_langchain_tool(tool: Tool, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a LangChain tool with safety checks."""
        try:
            # LangChain tool execution placeholder
            # In production, import and execute actual LangChain tools
            logger.info(f"Executing LangChain tool: {tool.name}")
            return {
                "success": True,
                "result": f"LangChain tool '{tool.name}' executed (placeholder)",
                "parameters": parameters
            }
        except Exception as e:
            logger.error(f"LangChain tool execution error: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_tool_categories(db: Session) -> List[str]:
        """Get list of all tool categories."""
        categories = db.query(Tool.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]


# Singleton instance
tool_service = ToolService()
