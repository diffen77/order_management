from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List
from decimal import Decimal


class OrderItem(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    created_at: datetime

    class Config:
        orm_mode = True


class Order(BaseModel):
    id: UUID
    form_id: UUID
    customer_id: UUID
    producer_id: UUID
    order_date: datetime
    status: str = "new"
    total_amount: Decimal
    currency: str = "SEK"
    notes: Optional[str] = None
    customer_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    items: Optional[List[OrderItem]] = None

    class Config:
        orm_mode = True 