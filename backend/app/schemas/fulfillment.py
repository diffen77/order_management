"""
Schemas for fulfillment-related data models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class FulfillmentStatus(str):
    """Valid fulfillment status values"""
    PENDING = "pending"
    PROCESSING = "processing"
    PICKED = "picked"
    PACKED = "packed"
    READY = "ready"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PickListItem(BaseModel):
    """Item in a pick list"""
    product_id: UUID
    product_name: str
    sku: Optional[str] = None
    quantity: int
    location: Optional[str] = None
    notes: Optional[str] = None


class PickList(BaseModel):
    """Pick list for a producer to fulfill orders"""
    id: UUID
    producer_id: UUID
    producer_name: str
    created_at: datetime
    items: List[PickListItem]
    total_items: int
    notes: Optional[str] = None
    status: str = FulfillmentStatus.PENDING


class PackingSlipItem(BaseModel):
    """Item in a packing slip"""
    product_id: UUID
    product_name: str
    sku: Optional[str] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class PackingSlip(BaseModel):
    """Packing slip for an order"""
    id: UUID
    order_id: UUID
    customer_name: str
    customer_email: Optional[str] = None
    shipping_address: Optional[Dict[str, Any]] = None
    created_at: datetime
    items: List[PackingSlipItem]
    total_items: int
    subtotal: Decimal
    shipping_cost: Optional[Decimal] = None
    total_amount: Decimal
    currency: str = "SEK"
    notes: Optional[str] = None
    pickup_instructions: Optional[str] = None


class FulfillmentRequest(BaseModel):
    """Request to initiate fulfillment for an order"""
    order_id: UUID
    shipping_method_id: str
    notes: Optional[str] = None


class FulfillmentStatusUpdate(BaseModel):
    """Request to update fulfillment status"""
    status: str
    notes: Optional[str] = None


class ShippingInfo(BaseModel):
    """Shipping information for a fulfillment"""
    carrier: str
    tracking_number: str
    shipping_date: datetime
    notes: Optional[str] = None


class Fulfillment(BaseModel):
    """Fulfillment record"""
    id: UUID
    order_id: UUID
    status: str = FulfillmentStatus.PENDING
    created_at: datetime
    updated_at: datetime
    shipping_method_id: Optional[str] = None
    shipping_cost: Optional[Decimal] = None
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    pick_list_id: Optional[UUID] = None
    packing_slip_id: Optional[UUID] = None

    class Config:
        orm_mode = True 