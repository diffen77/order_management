from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from uuid import UUID


class UserRole(str, Enum):
    ADMIN = "admin"
    PRODUCER = "producer"


class SubscriptionPlan(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"


class UserBase(BaseModel):
    email: EmailStr
    company_name: str
    subdomain: str
    role: UserRole = UserRole.PRODUCER
    subscription_plan: SubscriptionPlan = SubscriptionPlan.FREE


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    company_name: Optional[str] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    password: Optional[str] = None


class User(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    role: str = "producer"
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ProducerProfile(BaseModel):
    id: UUID
    company_logo: Optional[str] = None
    company_description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    subscription_tier: str = "free"
    subscription_status: str = "active"
    subscription_start_date: Optional[datetime] = None
    subscription_end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 