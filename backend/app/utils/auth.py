from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.supabase import get_supabase_client
from app.services import user_service
from typing import Optional
from uuid import UUID

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
supabase = get_supabase_client()

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get the current authenticated user.
    """
    try:
        # Verify token and get user
        user = supabase.auth.get_user(token)
        user_id = user.user.id
        
        # Get user from database
        db_user = await user_service.get_user_by_id(UUID(user_id))
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return db_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_admin(current_user = Depends(get_current_user)):
    """
    Get the current authenticated admin user.
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    return current_user 