"""
Rate limiting configuration using SlowAPI.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter with IP-based key function
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],  # Default: 200 requests per minute
    storage_uri="memory://",  # Use in-memory storage for now
)


# Rate limit decorators for specific endpoints
def rate_limit_auth():
    """Rate limit for authentication endpoints: 10/minute"""
    return limiter.limit("10/minute")


def rate_limit_execute():
    """Rate limit for execution endpoints: 20/minute"""
    return limiter.limit("20/minute")


def rate_limit_standard():
    """Standard rate limit: 100/minute"""
    return limiter.limit("100/minute")
