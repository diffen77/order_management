from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    company_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ProducerProfileBase(BaseModel):
    company_logo: Optional[str] = None
    company_description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None


class ProducerProfileCreate(ProducerProfileBase):
    pass


class ProducerProfileUpdate(ProducerProfileBase):
    pass


class ProducerProfileResponse(ProducerProfileBase):
    id: UUID
    subscription_tier: str
    subscription_status: str
    subscription_start_date: Optional[datetime] = None
    subscription_end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class UserWithProfile(UserResponse):
    profile: Optional[ProducerProfileResponse] = None 