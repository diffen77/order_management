from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum


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
    # Producer-specific fields
    business_name: Optional[str] = None
    business_id: Optional[str] = None
    producer_type: Optional[ProducerType] = None
    website: Optional[HttpUrl] = None
    description: Optional[str] = None
    is_active: Optional[bool] = True


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    # Producer-specific fields
    business_name: Optional[str] = None
    business_id: Optional[str] = None
    producer_type: Optional[ProducerType] = None
    website: Optional[HttpUrl] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Alias classes for Producer endpoints (same data structure, different naming)
class ProducerBase(CustomerBase):
    pass


class ProducerCreate(CustomerCreate):
    producer_type: ProducerType


class ProducerUpdate(CustomerUpdate):
    pass


class ProducerResponse(CustomerResponse):
    pass


class ProducerPreferencesBase(BaseModel):
    preferences: Dict[str, Any] = {}


class ProducerPreferencesCreate(ProducerPreferencesBase):
    producer_id: UUID


class ProducerPreferencesUpdate(ProducerPreferencesBase):
    pass


class ProducerPreferencesResponse(ProducerPreferencesBase):
    producer_id: UUID
    updated_at: datetime
    
    class Config:
        orm_mode = True


class ProducerNoteBase(BaseModel):
    content: str


class ProducerNoteCreate(ProducerNoteBase):
    producer_id: UUID


class ProducerNoteResponse(ProducerNoteBase):
    id: UUID
    producer_id: UUID
    created_by: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True


class ProducerWithDetails(ProducerResponse):
    notes: Optional[List[ProducerNoteResponse]] = []
    preferences: Optional[ProducerPreferencesResponse] = None
    
    class Config:
        orm_mode = True 