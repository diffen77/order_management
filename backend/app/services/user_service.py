from app.services.supabase import get_supabase_client
from app.schemas.user import UserCreate, UserUpdate, ProducerProfileCreate, ProducerProfileUpdate
from typing import Optional, Dict, List, Any
from uuid import UUID


supabase = get_supabase_client()


async def create_user(user_data: UserCreate) -> Dict[str, Any]:
    """
    Create a new user in the auth system and add user data to the users table.
    """
    # Create auth user
    auth_user = supabase.auth.admin.create_user({
        "email": user_data.email,
        "password": user_data.password,
        "email_confirm": True
    })
    
    user_id = auth_user.user.id
    
    # Create user record
    user = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "company_name": user_data.company_name,
        "role": "producer"  # Default role
    }
    
    result = supabase.table("users").insert(user).execute()
    
    # Create producer profile
    producer_profile = {
        "id": user_id,
        "subscription_tier": "free",
        "subscription_status": "active"
    }
    
    supabase.table("producer_profiles").insert(producer_profile).execute()
    
    return result.data[0]


async def get_user_by_id(user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Get a user by ID.
    """
    result = supabase.table("users").select("*").eq("id", str(user_id)).execute()
    
    if not result.data:
        return None
    
    return result.data[0]


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by email.
    """
    result = supabase.table("users").select("*").eq("email", email).execute()
    
    if not result.data:
        return None
    
    return result.data[0]


async def update_user(user_id: UUID, user_data: UserUpdate) -> Dict[str, Any]:
    """
    Update a user's data.
    """
    data = {k: v for k, v in user_data.dict().items() if v is not None}
    
    result = supabase.table("users").update(data).eq("id", str(user_id)).execute()
    
    return result.data[0]


async def get_producer_profile(user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Get a producer profile by user ID.
    """
    result = supabase.table("producer_profiles").select("*").eq("id", str(user_id)).execute()
    
    if not result.data:
        return None
    
    return result.data[0]


async def update_producer_profile(user_id: UUID, profile_data: ProducerProfileUpdate) -> Dict[str, Any]:
    """
    Update a producer profile.
    """
    data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    result = supabase.table("producer_profiles").update(data).eq("id", str(user_id)).execute()
    
    return result.data[0]


async def get_user_with_profile(user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Get a user with their producer profile.
    """
    user = await get_user_by_id(user_id)
    
    if not user:
        return None
    
    profile = await get_producer_profile(user_id)
    
    return {
        **user,
        "profile": profile
    } 