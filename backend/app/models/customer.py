from pydantic import BaseModel, Field, EmailStr, validator, HttpUrl
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class CustomerType(str, Enum):
    REGULAR = "regular"
    WHOLESALE = "wholesale"
    VIP = "VIP"


class ProducerType(str, Enum):
    SMALL_FARM = "small_farm"
    WHOLESALE_SUPPLIER = "wholesale_supplier"
    ARTISAN_VENDOR = "artisan_vendor"


class CustomerBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    customer_type: CustomerType = CustomerType.REGULAR
    # Producer-specific fields
    business_name: Optional[str] = None
    business_id: Optional[str] = None
    producer_type: Optional[ProducerType] = None
    website: Optional[HttpUrl] = None
    description: Optional[str] = None
    is_active: bool = True


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
    # Producer-specific fields
    business_name: Optional[str] = None
    business_id: Optional[str] = None
    producer_type: Optional[ProducerType] = None
    website: Optional[HttpUrl] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


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


# Producer alias classes for consistent API naming
Producer = Customer
ProducerWithDetails = CustomerWithDetails


# Update forward references
CustomerWithDetails.update_forward_refs() 