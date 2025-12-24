"""
Logging configuration.
"""
import logging
import sys
from app.config import settings

# Create logger
logger = logging.getLogger("crewai_manager")
logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

# Create console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

# Create formatter
formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
console_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(console_handler)
