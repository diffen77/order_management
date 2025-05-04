"""
Error handling middleware for FastAPI.
This module provides centralized error handling for the application.
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling exceptions globally and returning standardized error responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            return await call_next(request)
        except Exception as e:
            # Log the exception
            logger.error(f"Request to {request.url} failed: {str(e)}")
            
            # Return a standardized error response
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": f"An unexpected error occurred: {str(e)}",
                    "path": str(request.url.path)
                }
            )

def setup_error_handler(app: FastAPI) -> None:
    """
    Configure the application with error handling middleware.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(ErrorHandlerMiddleware)
    
    # Setup exception handlers for specific status codes
    @app.exception_handler(404)
    async def not_found_exception_handler(request: Request, exc):
        return JSONResponse(
            status_code=404,
            content={
                "error": "Not Found",
                "message": "The requested resource was not found",
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(422)
    async def validation_exception_handler(request: Request, exc):
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "message": "Request validation failed",
                "detail": exc.errors() if hasattr(exc, "errors") else str(exc),
                "path": str(request.url.path)
            }
        ) 