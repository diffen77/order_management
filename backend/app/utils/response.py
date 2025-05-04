"""
API response formatting utilities.
This module provides standardized response formatting for all API endpoints.
"""
from typing import Any, Dict, List, Optional, Union
from fastapi.responses import JSONResponse
from fastapi import status

def success_response(
    data: Any = None, 
    message: str = "Success", 
    status_code: int = status.HTTP_200_OK,
    meta: Optional[Dict] = None
) -> Dict:
    """
    Create a standardized success response format.
    
    Args:
        data: The response data
        message: Success message
        status_code: HTTP status code
        meta: Optional metadata (e.g., pagination info)
        
    Returns:
        Formatted response dictionary
    """
    response = {
        "success": True,
        "message": message,
        "data": data or {}
    }
    
    if meta:
        response["meta"] = meta
        
    return response

def error_response(
    message: str = "An error occurred",
    errors: Optional[Union[List, Dict]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    code: Optional[str] = None
) -> Dict:
    """
    Create a standardized error response format.
    
    Args:
        message: Error message
        errors: Detailed error information
        status_code: HTTP status code
        code: Optional error code for client handling
        
    Returns:
        Formatted error response dictionary
    """
    response = {
        "success": False,
        "message": message
    }
    
    if errors:
        response["errors"] = errors
        
    if code:
        response["code"] = code
        
    return response

def pagination_meta(
    total: int,
    page: int = 1,
    page_size: int = 100,
    base_url: Optional[str] = None
) -> Dict:
    """
    Create pagination metadata for list responses.
    
    Args:
        total: Total number of items
        page: Current page number
        page_size: Items per page
        base_url: Optional base URL for next/prev links
        
    Returns:
        Pagination metadata dictionary
    """
    total_pages = (total + page_size - 1) // page_size
    
    meta = {
        "page": page,
        "page_size": page_size,
        "total_items": total,
        "total_pages": total_pages
    }
    
    if base_url:
        if page < total_pages:
            meta["next"] = f"{base_url}?page={page+1}&limit={page_size}"
        if page > 1:
            meta["prev"] = f"{base_url}?page={page-1}&limit={page_size}"
    
    return meta 