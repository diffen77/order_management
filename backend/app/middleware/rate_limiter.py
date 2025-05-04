"""
Rate limiting middleware for FastAPI.
This module provides rate limiting to prevent API abuse.
"""
import time
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Callable, List, Optional
from app.utils.logging import setup_logger
from app.utils.errors import RateLimitError

logger = setup_logger(__name__)

class RateLimiter:
    """Base rate limiter class."""
    
    def __init__(self, rate_limit: int, time_window: int):
        """
        Initialize the rate limiter.
        
        Args:
            rate_limit: Maximum number of requests allowed
            time_window: Time window in seconds
        """
        self.rate_limit = rate_limit
        self.time_window = time_window
        self.requests: Dict[str, List[float]] = {}
    
    def is_rate_limited(self, key: str) -> bool:
        """
        Check if a key is rate limited.
        
        Args:
            key: Identifier for the client (e.g., IP address)
            
        Returns:
            True if rate limited, False otherwise
        """
        current_time = time.time()
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove timestamps older than the time window
        self.requests[key] = [
            ts for ts in self.requests[key] if current_time - ts <= self.time_window
        ]
        
        # Check if the number of requests exceeds the rate limit
        if len(self.requests[key]) >= self.rate_limit:
            return True
        
        # Add current timestamp
        self.requests[key].append(current_time)
        return False
    
    def get_retry_after(self, key: str) -> Optional[int]:
        """
        Get the number of seconds until the rate limit resets.
        
        Args:
            key: Identifier for the client
            
        Returns:
            Seconds until rate limit resets or None if not rate limited
        """
        if key not in self.requests or not self.requests[key]:
            return None
        
        current_time = time.time()
        oldest_timestamp = min(self.requests[key])
        
        return max(1, int(self.time_window - (current_time - oldest_timestamp)))

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting API requests."""
    
    def __init__(
        self,
        app,
        rate_limit: int = 100,
        time_window: int = 60,
        exempt_paths: List[str] = None
    ):
        """
        Initialize the middleware.
        
        Args:
            app: FastAPI application instance
            rate_limit: Maximum number of requests allowed in the time window
            time_window: Time window in seconds
            exempt_paths: List of paths exempt from rate limiting
        """
        super().__init__(app)
        self.limiter = RateLimiter(rate_limit, time_window)
        self.exempt_paths = exempt_paths or ["/health", "/docs", "/openapi.json"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for exempt paths
        path = request.url.path
        if any(path.startswith(exempt) for exempt in self.exempt_paths):
            return await call_next(request)
        
        # Use client IP as the rate limit key
        client_ip = request.client.host if request.client else "unknown"
        
        # Check if rate limited
        if self.limiter.is_rate_limited(client_ip):
            retry_after = self.limiter.get_retry_after(client_ip)
            logger.warning(f"Rate limit exceeded for {client_ip}")
            
            # Raise custom rate limit error
            raise RateLimitError(
                message="Rate limit exceeded",
                retry_after=retry_after
            )
        
        # Process the request if not rate limited
        return await call_next(request)

def setup_rate_limiter(
    app: FastAPI,
    rate_limit: int = 100,
    time_window: int = 60,
    exempt_paths: List[str] = None
) -> None:
    """
    Configure the application with rate limiting middleware.
    
    Args:
        app: FastAPI application instance
        rate_limit: Maximum number of requests allowed in the time window
        time_window: Time window in seconds
        exempt_paths: List of paths exempt from rate limiting
    """
    app.add_middleware(
        RateLimiterMiddleware,
        rate_limit=rate_limit,
        time_window=time_window,
        exempt_paths=exempt_paths
    ) 