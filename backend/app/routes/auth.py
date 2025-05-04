from fastapi import APIRouter, HTTPException, status, Depends, Body
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services import user_service
from app.services.supabase import get_supabase_client
from app.utils.auth import get_current_user, get_current_admin
from typing import Dict, List, Any
from uuid import UUID

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

supabase = get_supabase_client()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user account with email and password.
    """
    try:
        # Check if user with email already exists
        existing_user = await user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        return await user_service.create_user(user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, str]:
    """
    Authenticate a user and return an access token.
    """
    try:
        # Authenticate user with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password
        })
        
        # Log successful login
        try:
            supabase.rpc(
                'log_auth_event',
                {
                    'p_user_id': response.user.id,
                    'p_event_type': 'login',
                    'p_ip_address': None,
                    'p_user_agent': None
                }
            ).execute()
        except Exception:
            # Don't fail the login if logging fails
            pass
        
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user_id": response.user.id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout")
async def logout(current_user: Dict = Depends(get_current_user)):
    """
    Log out the current user by invalidating their token.
    """
    try:
        # Log the logout event
        try:
            supabase.rpc(
                'log_auth_event',
                {
                    'p_user_id': current_user["id"],
                    'p_event_type': 'logout',
                    'p_ip_address': None,
                    'p_user_agent': None
                }
            ).execute()
        except Exception:
            # Don't fail the logout if logging fails
            pass
            
        # Sign out the current user
        supabase.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/password-reset")
async def request_password_reset(email: str = Body(..., embed=True)):
    """
    Request a password reset email for the specified user.
    """
    try:
        # Check if user exists
        user = await user_service.get_user_by_email(email)
        if not user:
            # Return success even if email doesn't exist to prevent email enumeration
            return {"message": "Password reset email sent if the account exists"}
        
        # Send password reset email
        supabase.auth.reset_password_email(email)
        
        return {"message": "Password reset email sent if the account exists"}
    except Exception as e:
        # Return generic message to prevent email enumeration
        return {"message": "Password reset email sent if the account exists"}


@router.post("/password-update")
async def update_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Update the current user's password.
    """
    try:
        # Verify current password
        try:
            supabase.auth.sign_in_with_password({
                "email": current_user["email"],
                "password": current_password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        supabase.auth.admin.update_user_by_id(
            current_user["id"],
            {"password": new_password}
        )
        
        # Log password change
        try:
            supabase.rpc(
                'log_auth_event',
                {
                    'p_user_id': current_user["id"],
                    'p_event_type': 'password_change',
                    'p_ip_address': None,
                    'p_user_agent': None
                }
            ).execute()
        except Exception:
            # Don't fail the password change if logging fails
            pass
        
        return {"message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    return current_user


@router.post("/refresh-token")
async def refresh_access_token(refresh_token: str = Body(..., embed=True)):
    """
    Refresh the access token using a refresh token.
    """
    try:
        response = supabase.auth.refresh_session(refresh_token)
        
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user_id": response.user.id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) 