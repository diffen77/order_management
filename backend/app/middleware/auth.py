from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.status import HTTP_403_FORBIDDEN, HTTP_401_UNAUTHORIZED
from typing import List, Optional, Dict, Any, Callable
from functools import wraps
import jwt
from app.utils.config import settings
from app.utils.logging import setup_logger

logger = setup_logger(__name__)
security = HTTPBearer()

# Define role hierarchy (higher number = higher access)
ROLE_HIERARCHY = {
    'admin': 3,
    'producer': 2,
    'staff': 1
}

# Define permissions for each role
ROLE_PERMISSIONS = {
    'admin': [
        'create:users',
        'read:users',
        'update:users',
        'delete:users',
        'create:orders',
        'read:orders',
        'update:orders',
        'delete:orders',
        'create:products',
        'read:products',
        'update:products',
        'delete:products',
        'read:statistics',
        'manage:forms',
        'manage:settings'
    ],
    'producer': [
        'create:products',
        'read:products',
        'update:products',
        'delete:products',
        'read:orders',
        'update:orders',
        'read:statistics',
        'manage:forms',
        'manage:settings'
    ],
    'staff': [
        'read:products',
        'read:orders',
        'update:orders'
    ]
}

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token and return the payload.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(payload: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get the current user from the JWT payload.
    """
    user_id = payload.get("sub")
    if not user_id:
        logger.warning("User ID not found in token")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Add user data from payload
    user_data = {
        "id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "staff"),  # Default to lowest role if not specified
    }
    
    return user_data

def has_permission(user_role: str, required_permission: str) -> bool:
    """
    Check if a role has a specific permission.
    """
    if not user_role:
        return False
    
    return required_permission in ROLE_PERMISSIONS.get(user_role, [])

def has_all_permissions(user_role: str, required_permissions: List[str]) -> bool:
    """
    Check if a role has all of the required permissions.
    """
    if not user_role:
        return False
    
    return all(perm in ROLE_PERMISSIONS.get(user_role, []) for perm in required_permissions)

def has_any_permission(user_role: str, required_permissions: List[str]) -> bool:
    """
    Check if a role has any of the required permissions.
    """
    if not user_role:
        return False
    
    return any(perm in ROLE_PERMISSIONS.get(user_role, []) for perm in required_permissions)

def has_minimum_role(user_role: str, required_role: str) -> bool:
    """
    Check if a user has at least the required role in the hierarchy.
    """
    if not user_role:
        return False
    
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    required_level = ROLE_HIERARCHY.get(required_role, 0)
    
    return user_level >= required_level

def require_permission(permission: str):
    """
    Dependency for routes that require a specific permission.
    """
    async def dependency(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role")
        if not has_permission(user_role, permission):
            logger.warning(f"User {user.get('id')} with role {user_role} denied access: missing permission {permission}")
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to perform this action"
            )
        return user
    
    return dependency

def require_any_permission(permissions: List[str]):
    """
    Dependency for routes that require any of the specified permissions.
    """
    async def dependency(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role")
        if not has_any_permission(user_role, permissions):
            logger.warning(f"User {user.get('id')} with role {user_role} denied access: missing permissions {permissions}")
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to perform this action"
            )
        return user
    
    return dependency

def require_all_permissions(permissions: List[str]):
    """
    Dependency for routes that require all of the specified permissions.
    """
    async def dependency(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role")
        if not has_all_permissions(user_role, permissions):
            logger.warning(f"User {user.get('id')} with role {user_role} denied access: missing permissions {permissions}")
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to perform this action"
            )
        return user
    
    return dependency

def require_role(role: str):
    """
    Dependency for routes that require a specific role or higher.
    """
    async def dependency(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role")
        if not has_minimum_role(user_role, role):
            logger.warning(f"User {user.get('id')} with role {user_role} denied access: requires role {role}")
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail=f"This action requires at least {role} privileges"
            )
        return user
    
    return dependency 