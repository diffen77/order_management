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


# Fulfillment Reporting Schemas

class FulfillmentMetric(BaseModel):
    """A single fulfillment metric with value and comparison to previous period"""
    name: str
    value: Any
    unit: str
    previous_value: Optional[Any] = None
    change_percentage: Optional[float] = None
    trend: Optional[str] = None  # "up", "down", "unchanged"
    details: Optional[Dict[str, Any]] = None


class FulfillmentTimeMetrics(BaseModel):
    """Time-based fulfillment metrics"""
    avg_fulfillment_time: FulfillmentMetric
    avg_processing_time: FulfillmentMetric
    avg_shipping_time: FulfillmentMetric
    orders_fulfilled_on_time: FulfillmentMetric
    orders_fulfilled_late: FulfillmentMetric


class FulfillmentAccuracyMetrics(BaseModel):
    """Accuracy-based fulfillment metrics"""
    order_accuracy_rate: FulfillmentMetric
    error_rate: FulfillmentMetric
    error_types: Dict[str, FulfillmentMetric]
    returns_rate: FulfillmentMetric


class FulfillmentCostMetrics(BaseModel):
    """Cost-based fulfillment metrics"""
    avg_shipping_cost: FulfillmentMetric
    total_shipping_cost: FulfillmentMetric
    shipping_cost_by_method: Dict[str, FulfillmentMetric]
    fulfillment_cost_per_order: FulfillmentMetric


class FulfillmentVolumeMetrics(BaseModel):
    """Volume-based fulfillment metrics"""
    total_orders_fulfilled: FulfillmentMetric
    orders_by_status: Dict[str, FulfillmentMetric]
    orders_by_shipping_method: Dict[str, FulfillmentMetric]
    avg_items_per_order: FulfillmentMetric


class FulfillmentReportFilters(BaseModel):
    """Filters for fulfillment reports"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    producer_id: Optional[UUID] = None
    status: Optional[str] = None
    shipping_method_id: Optional[str] = None
    compare_to_previous: bool = False


class FulfillmentMetricsReport(BaseModel):
    """Comprehensive metrics report for fulfillment"""
    id: UUID
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    filters: FulfillmentReportFilters
    time_metrics: FulfillmentTimeMetrics
    accuracy_metrics: FulfillmentAccuracyMetrics
    cost_metrics: FulfillmentCostMetrics
    volume_metrics: FulfillmentVolumeMetrics


class FulfillmentPerformanceReport(BaseModel):
    """Performance report for fulfillment operations"""
    id: UUID
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    filters: FulfillmentReportFilters
    producer_performance: Dict[UUID, Dict[str, FulfillmentMetric]]
    shipping_method_performance: Dict[str, Dict[str, FulfillmentMetric]]
    overall_performance: Dict[str, FulfillmentMetric]
    top_performing_producers: List[Dict[str, Any]]
    areas_for_improvement: List[Dict[str, Any]]


class FulfillmentExceptionReport(BaseModel):
    """Report on fulfillment exceptions"""
    id: UUID
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    filters: FulfillmentReportFilters
    total_exceptions: int
    exception_types: Dict[str, FulfillmentMetric]
    order_exceptions: List[Dict[str, Any]]
    resolution_metrics: Dict[str, FulfillmentMetric]
    producer_exceptions: Dict[UUID, Dict[str, Any]]


class ReportSchedule(BaseModel):
    """Schedule for report generation and distribution"""
    id: UUID
    report_type: str  # "metrics", "performance", "exceptions", etc.
    frequency: str  # "daily", "weekly", "monthly"
    recipients: List[Dict[str, Any]]
    filters: FulfillmentReportFilters
    format: str = "json"  # "json", "csv", "pdf"
    active: bool = True
    next_generation: datetime
    last_generated: Optional[datetime] = None


class ReportExportRequest(BaseModel):
    """Request to export a report in a specific format"""
    report_id: UUID
    format: str = "csv"  # "json", "csv", "pdf", "excel"
    include_charts: bool = True 