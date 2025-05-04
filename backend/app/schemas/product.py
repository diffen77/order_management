from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str = "SEK"
    stock_quantity: int = 0
    unit: str = "st"
    category: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    currency: Optional[str] = None
    stock_quantity: Optional[int] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: UUID
    producer_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 