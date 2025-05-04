"""
Error handling middleware for FastAPI.
This module provides centralized error handling for the application.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Callable, Dict, Any
from app.utils.logging import setup_logger
from app.utils.errors import APIError, ValidationError, NotFoundError
import traceback
import json

logger = setup_logger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling exceptions globally and returning standardized error responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            return await call_next(request)
        except Exception as e:
            # Get request ID from request state if available
            request_id = getattr(request.state, "request_id", "unknown")
            
            # Log the exception with traceback for debugging
            logger.error(
                f"Request {request_id} failed with exception: {str(e)}\n"
                f"Traceback: {traceback.format_exc()}"
            )
            
            # Handle different exception types
            if isinstance(e, APIError):
                # Our custom API exceptions
                return JSONResponse(
                    status_code=e.status_code,
                    content=e.to_dict()
                )
            elif isinstance(e, StarletteHTTPException):
                # FastAPI/Starlette HTTP exceptions
                return JSONResponse(
                    status_code=e.status_code,
                    content={
                        "success": False,
                        "message": str(e.detail),
                        "code": f"HTTP_{e.status_code}"
                    }
                )
            else:
                # Generic exceptions
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "success": False,
                        "message": "Internal Server Error",
                        "detail": str(e),
                        "request_id": request_id
                    }
                )

def setup_error_handler(app: FastAPI) -> None:
    """
    Configure the application with error handling middleware and exception handlers.
    
    Args:
        app: FastAPI application instance
    """
    # Add the middleware for catching general exceptions
    app.add_middleware(ErrorHandlerMiddleware)
    
    # Setup specific exception handlers
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format validation errors in a more readable way
        errors = []
        for error in exc.errors():
            loc = error.get("loc", [])
            field = loc[-1] if loc else ""
            type_error = error.get("type", "")
            msg = error.get("msg", "")
            
            errors.append({
                "field": field,
                "type": type_error,
                "message": msg
            })
        
        logger.warning(f"Validation error: {json.dumps(errors)}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Validation error",
                "code": "VALIDATION_ERROR",
                "errors": errors
            }
        )
    
    @app.exception_handler(404)
    async def not_found_exception_handler(request: Request, exc):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Resource not found",
                "code": "NOT_FOUND",
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(500)
    async def internal_error_handler(request: Request, exc):
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Log the error
        logger.error(
            f"Internal server error on {request.url.path} (Request ID: {request_id}): {str(exc)}\n"
            f"Traceback: {traceback.format_exc()}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
                "request_id": request_id
            }
        ) 