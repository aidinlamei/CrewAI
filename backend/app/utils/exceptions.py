"""
Custom exceptions for the application.
"""


class CrewAIManagerException(Exception):
    """Base exception for CrewAI Manager."""
    pass


class DatabaseException(CrewAIManagerException):
    """Database-related exceptions."""
    pass


class NotFoundError(CrewAIManagerException):
    """Resource not found."""
    pass


class ValidationError(CrewAIManagerException):
    """Validation error."""
    pass


class LLMProviderError(CrewAIManagerException):
    """LLM provider connection or execution error."""
    pass


class ToolExecutionError(CrewAIManagerException):
    """Tool execution error."""
    pass


class CrewExecutionError(CrewAIManagerException):
    """Crew execution error."""
    pass


class EncryptionError(CrewAIManagerException):
    """Encryption/decryption error."""
    pass
