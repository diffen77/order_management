from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class OrderItemBase(BaseModel):
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    sku: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: UUID
    order_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True


class OrderNoteBase(BaseModel):
    content: str
    is_internal: bool = False


class OrderNoteCreate(OrderNoteBase):
    pass


class OrderNoteResponse(OrderNoteBase):
    id: UUID
    order_id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        orm_mode = True


class OrderHistoryBase(BaseModel):
    previous_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None


class OrderHistoryCreate(OrderHistoryBase):
    pass


class OrderHistoryResponse(OrderHistoryBase):
    id: UUID
    order_id: UUID
    changed_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        orm_mode = True


# New schema for shipping methods
class ShippingMethod(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    estimated_days: Optional[int] = None
    carrier: Optional[str] = None
    is_active: bool = True


# New schema for shipping cost calculation request
class ShippingCalculationRequest(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: Dict[str, Any]
    shipping_method_id: Optional[str] = None


# New schema for shipping cost calculation response
class ShippingCalculationResponse(BaseModel):
    available_methods: List[ShippingMethod]
    recommended_method_id: Optional[str] = None


class OrderBase(BaseModel):
    customer_id: UUID
    status: str = "new"
    payment_status: str = "pending"
    total_amount: Decimal
    currency: str = "SEK"
    shipping_address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    # Add shipping-related fields
    shipping_method_id: Optional[str] = None
    shipping_cost: Optional[Decimal] = None
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    fulfillment_status: Optional[str] = "pending"


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    shipping_address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    # Add shipping-related fields to update
    shipping_method_id: Optional[str] = None
    shipping_cost: Optional[Decimal] = None
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    fulfillment_status: Optional[str] = None


class OrderResponse(OrderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class OrderWithItems(OrderResponse):
    items: List[OrderItemResponse] = []
    

class OrderWithDetails(OrderWithItems):
    history: List[OrderHistoryResponse] = []
    order_notes: List[OrderNoteResponse] = [] 