"""
Middleware package initialization.
This module contains middleware components for the FastAPI application.
"""

from app.middleware.error_handler import setup_error_handlers
from app.middleware.auth import (
    get_current_user,
    require_permission,
    require_any_permission,
    require_all_permissions,
    require_role,
    has_permission,
    has_minimum_role
)

__all__ = [
    'setup_error_handlers',
    'get_current_user',
    'require_permission',
    'require_any_permission',
    'require_all_permissions',
    'require_role',
    'has_permission',
    'has_minimum_role'
] 