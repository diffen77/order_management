"""
Request logging middleware for FastAPI.
This module provides request and response logging for all API endpoints.
"""
import time
import uuid
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware for logging API requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        
        # Add request ID to the request state
        request.state.request_id = request_id
        
        # Capture request info
        start_time = time.time()
        method = request.method
        url = str(request.url)
        client_host = request.client.host if request.client else "unknown"
        
        # Log the incoming request
        logger.info(
            f"Request {request_id} started: {method} {url} from {client_host}"
        )
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            formatted_process_time = "{:.3f}".format(process_time)
            
            # Add headers to the response
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = formatted_process_time
            
            # Log the response
            status_code = response.status_code
            logger.info(
                f"Request {request_id} completed: {method} {url} - {status_code} in {formatted_process_time}s"
            )
            
            return response
        except Exception as e:
            # Calculate processing time
            process_time = time.time() - start_time
            formatted_process_time = "{:.3f}".format(process_time)
            
            # Log the exception
            logger.error(
                f"Request {request_id} failed: {method} {url} - Exception: {str(e)} in {formatted_process_time}s"
            )
            
            # Re-raise the exception for the error handler middleware
            raise

def setup_request_logger(app: FastAPI) -> None:
    """
    Configure the application with request logging middleware.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(RequestLoggerMiddleware) 