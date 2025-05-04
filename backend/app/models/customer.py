from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional


class Customer(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 