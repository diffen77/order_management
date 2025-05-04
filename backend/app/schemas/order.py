from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class OrderItemBase(BaseModel):
    product_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: UUID
    order_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True


class OrderBase(BaseModel):
    form_id: UUID
    customer_id: UUID
    status: str = "new"
    total_amount: Decimal
    currency: str = "SEK"
    notes: Optional[str] = None
    customer_data: Optional[Dict[str, Any]] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class OrderResponse(OrderBase):
    id: UUID
    producer_id: UUID
    order_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class OrderWithItems(OrderResponse):
    items: List[OrderItemResponse] = [] 