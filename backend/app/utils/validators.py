"""
Validation utilities.
"""
import re
from typing import Any, Dict


def validate_python_code(code: str) -> bool:
    """
    Validate Python code syntax.

    Args:
        code: Python code string

    Returns:
        True if valid, False otherwise
    """
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError:
        return False


def validate_json_structure(data: Dict[str, Any], required_fields: list[str]) -> bool:
    """
    Validate JSON structure has required fields.

    Args:
        data: JSON data dictionary
        required_fields: List of required field names

    Returns:
        True if valid, False otherwise
    """
    return all(field in data for field in required_fields)


def validate_email(email: str) -> bool:
    """
    Validate email format.

    Args:
        email: Email address string

    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_url(url: str) -> bool:
    """
    Validate URL format.

    Args:
        url: URL string

    Returns:
        True if valid, False otherwise
    """
    pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    return bool(re.match(pattern, url))
