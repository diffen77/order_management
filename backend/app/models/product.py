from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class Product(BaseModel):
    id: UUID
    producer_id: UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str = "SEK"
    stock_quantity: int = 0
    unit: str = "st"
    category: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 