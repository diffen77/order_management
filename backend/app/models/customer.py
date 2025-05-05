from pydantic import BaseModel, Field, EmailStr, validator
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class CustomerType(str, Enum):
    REGULAR = "regular"
    WHOLESALE = "wholesale"
    VIP = "VIP"


class CustomerBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    customer_type: CustomerType = CustomerType.REGULAR


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    customer_type: Optional[CustomerType] = None


class Customer(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class CustomerWithDetails(Customer):
    notes: Optional[List["CustomerNote"]] = []
    preferences: Optional["CustomerPreferences"] = None


class CustomerNoteBase(BaseModel):
    content: str


class CustomerNoteCreate(CustomerNoteBase):
    customer_id: UUID


class CustomerNote(CustomerNoteBase):
    id: UUID
    customer_id: UUID
    created_by: UUID
    created_at: datetime

    class Config:
        orm_mode = True


class CustomerPreferencesBase(BaseModel):
    preferences: Dict[str, Any] = {}


class CustomerPreferencesCreate(CustomerPreferencesBase):
    customer_id: UUID


class CustomerPreferencesUpdate(CustomerPreferencesBase):
    pass


class CustomerPreferences(CustomerPreferencesBase):
    customer_id: UUID
    updated_at: datetime

    class Config:
        orm_mode = True


# Update forward references
CustomerWithDetails.update_forward_refs() 