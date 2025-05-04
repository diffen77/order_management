"""
API information endpoints module.
This module provides endpoints for API metadata, version information, and health checks.
"""
from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from app.utils.config import settings
import time
import platform
import os

# Start time of the server
START_TIME = time.time()

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_api_info():
    """
    Get information about the API including version and documentation.
    """
    return {
        "name": "Order Management API",
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    uptime = int(time.time() - START_TIME)
    
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.API_VERSION,
        "uptime_seconds": uptime,
        "python_version": platform.python_version(),
        "system": platform.system(),
        "hostname": platform.node(),
    }

@router.get("/version", response_model=Dict[str, Any])
async def version_info():
    """
    Get detailed version information about the API.
    """
    # Try to read git commit information if available
    git_commit = "unknown"
    try:
        if os.path.exists(".git"):
            import subprocess
            git_commit = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], 
                stderr=subprocess.DEVNULL
            ).decode("utf-8").strip()
    except:
        pass
    
    return {
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
        "git_commit": git_commit,
        "build_date": os.getenv("BUILD_DATE", "development")
    } 