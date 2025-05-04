from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service
from app.services.supabase import get_supabase_client
from typing import Dict

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

supabase = get_supabase_client()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
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
    try:
        # Authenticate user with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password
        })
        
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