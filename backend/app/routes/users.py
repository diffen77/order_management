from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserUpdate, UserResponse, ProducerProfileUpdate, ProducerProfileResponse, UserWithProfile
from app.services import user_service
from typing import List
from uuid import UUID

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate):
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


@router.get("/{user_id}", response_model=UserWithProfile)
async def get_user(user_id: UUID):
    user = await user_service.get_user_with_profile(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: UUID, user_data: UserUpdate):
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return await user_service.update_user(user_id, user_data)


@router.get("/{user_id}/profile", response_model=ProducerProfileResponse)
async def get_producer_profile(user_id: UUID):
    profile = await user_service.get_producer_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producer profile not found"
        )
    
    return profile


@router.put("/{user_id}/profile", response_model=ProducerProfileResponse)
async def update_producer_profile(user_id: UUID, profile_data: ProducerProfileUpdate):
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = await user_service.get_producer_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producer profile not found"
        )
    
    return await user_service.update_producer_profile(user_id, profile_data) 