from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List
from decimal import Decimal


class OrderItem(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    sku: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        orm_mode = True


class OrderHistory(BaseModel):
    id: UUID
    order_id: UUID
    previous_status: Optional[str] = None
    new_status: str
    changed_by: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class OrderNote(BaseModel):
    id: UUID
    order_id: UUID
    user_id: Optional[UUID] = None
    content: str
    is_internal: bool = False
    created_at: datetime

    class Config:
        orm_mode = True


class Order(BaseModel):
    id: UUID
    customer_id: UUID
    status: str = "new"
    payment_status: str = "pending"
    total_amount: Decimal
    currency: str = "SEK"
    shipping_address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    items: Optional[List[OrderItem]] = None
    history: Optional[List[OrderHistory]] = None
    order_notes: Optional[List[OrderNote]] = None

    class Config:
        orm_mode = True 