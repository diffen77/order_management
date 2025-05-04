from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from app.schemas.user import UserCreate, UserUpdate, UserResponse, ProducerProfileUpdate, ProducerProfileResponse, UserWithProfile
from app.services import user_service
from app.middleware.auth import get_current_user, require_permission, require_role
from typing import Dict, List, Optional
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
async def get_user(
    user_id: UUID,
    current_user: Dict = Depends(require_permission("read:users"))
):
    user = await user_service.get_user_with_profile(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID, 
    user_data: UserUpdate,
    current_user: Dict = Depends(require_permission("update:users"))
):
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return await user_service.update_user(user_id, user_data)


@router.get("/{user_id}/profile", response_model=ProducerProfileResponse)
async def get_producer_profile(
    user_id: UUID,
    current_user: Dict = Depends(require_permission("read:users"))
):
    profile = await user_service.get_producer_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producer profile not found"
        )
    
    return profile


@router.put("/{user_id}/profile", response_model=ProducerProfileResponse)
async def update_producer_profile(
    user_id: UUID, 
    profile_data: ProducerProfileUpdate,
    current_user: Dict = Depends(require_permission("update:users"))
):
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


@router.get("", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: Dict = Depends(require_permission("read:users"))
):
    """
    Get a list of all users. Requires read:users permission.
    """
    try:
        # Get all users from Supabase
        response = user_service.supabase.table("users").select("*").range(skip, skip + limit).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: Dict = Depends(get_current_user)):
    """
    Get the profile of the currently authenticated user.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update the profile of the currently authenticated user.
    """
    try:
        updated_user = await user_service.update_user(UUID(current_user["id"]), user_data)
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/me/profile", response_model=ProducerProfileResponse)
async def get_my_producer_profile(current_user: Dict = Depends(get_current_user)):
    """
    Get the producer profile of the currently authenticated user.
    """
    try:
        profile = await user_service.get_producer_profile(UUID(current_user["id"]))
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producer profile not found"
            )
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/me/profile", response_model=ProducerProfileResponse)
async def update_my_producer_profile(
    profile_data: ProducerProfileUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update the producer profile of the currently authenticated user.
    """
    try:
        updated_profile = await user_service.update_producer_profile(UUID(current_user["id"]), profile_data)
        return updated_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    role: str = Body(..., embed=True),
    user_id: UUID = Path(...),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Update a user's role. Admin access only.
    """
    try:
        # Validate role
        valid_roles = ["admin", "producer", "staff"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        
        # Get the user to update
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update the role in the database
        updated_user = await user_service.update_user_role(user_id, role)
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID = Path(...),
    current_user: Dict = Depends(require_permission("delete:users"))
):
    """
    Delete a user. Requires delete:users permission.
    """
    try:
        # Get the user to delete
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete the user from the database
        await user_service.delete_user(user_id)
        
        # No content response
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 