"""
Custom exception classes for the application.
This module provides well-defined exceptions for different error scenarios.
"""
from fastapi import status
from typing import Any, Dict, List, Optional, Union

class APIError(Exception):
    """Base class for all API exceptions."""
    
    def __init__(
        self, 
        message: str = "An error occurred",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: Optional[str] = None,
        errors: Optional[Union[List, Dict]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        self.errors = errors
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to a dictionary format."""
        error_dict = {
            "success": False,
            "message": self.message
        }
        
        if self.code:
            error_dict["code"] = self.code
            
        if self.errors:
            error_dict["errors"] = self.errors
            
        return error_dict

class ValidationError(APIError):
    """Raised when request validation fails."""
    
    def __init__(
        self,
        message: str = "Validation error",
        errors: Optional[Union[List, Dict]] = None,
        code: str = "VALIDATION_ERROR"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=code,
            errors=errors
        )

class NotFoundError(APIError):
    """Raised when a requested resource is not found."""
    
    def __init__(
        self,
        resource: str = "Resource",
        resource_id: Optional[str] = None,
        code: str = "NOT_FOUND"
    ):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with ID {resource_id} not found"
            
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            code=code
        )

class AuthenticationError(APIError):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        code: str = "AUTHENTICATION_ERROR"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code
        )

class AuthorizationError(APIError):
    """Raised when a user doesn't have permission to perform an action."""
    
    def __init__(
        self,
        message: str = "You don't have permission to perform this action",
        code: str = "AUTHORIZATION_ERROR"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            code=code
        )

class DatabaseError(APIError):
    """Raised when a database operation fails."""
    
    def __init__(
        self,
        message: str = "Database operation failed",
        code: str = "DATABASE_ERROR"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code=code
        )

class ConflictError(APIError):
    """Raised when a resource already exists or conflicts with existing data."""
    
    def __init__(
        self,
        message: str = "Resource conflict",
        code: str = "CONFLICT_ERROR"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            code=code
        )

class RateLimitError(APIError):
    """Raised when a user has exceeded rate limits."""
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        code: str = "RATE_LIMIT_ERROR",
        retry_after: Optional[int] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code=code
        )
        self.retry_after = retry_after 