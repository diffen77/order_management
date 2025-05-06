"""
Fulfillment API endpoints module.
This module handles all API operations related to order fulfillment and shipping.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.middleware.auth import get_current_user, require_permission
from app.schemas.fulfillment import (
    FulfillmentRequest, FulfillmentStatusUpdate, ShippingInfo,
    Fulfillment, PickList, PackingSlip,
    FulfillmentMetricsReport, FulfillmentPerformanceReport, 
    FulfillmentExceptionReport, FulfillmentReportFilters,
    ReportSchedule, ReportExportRequest
)
from app.schemas.order import (
    ShippingCalculationRequest, ShippingCalculationResponse,
    ShippingMethod
)
from app.services.shipping_service import (
    calculate_shipping_cost, get_shipping_methods,
    get_shipping_method_by_id, apply_shipping_to_order
)
from app.services.order_service import get_order_by_id
from app.services.fulfillment_service import generate_producer_pick_list, generate_order_packing_slip, get_orders_by_producer, update_fulfillment_status, get_fulfillment_history
from app.services.validation_service import (
    validate_fulfillment_prerequisites,
    override_validation
)
from app.services.reporting_service import (
    generate_metrics_report, generate_performance_report,
    generate_exception_report, export_report, schedule_report
)


router = APIRouter()


@router.get("/shipping/methods", response_model=List[ShippingMethod])
async def list_shipping_methods(
    current_user: Dict = Depends(get_current_user)
):
    """
    Get available shipping methods.
    """
    return await get_shipping_methods()


@router.get("/shipping/methods/{method_id}", response_model=ShippingMethod)
async def get_shipping_method(
    method_id: str = Path(..., description="The ID of the shipping method"),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get details for a specific shipping method.
    """
    method = await get_shipping_method_by_id(method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipping method with ID '{method_id}' not found"
        )
    return method


@router.post("/shipping/calculate", response_model=ShippingCalculationResponse)
async def calculate_shipping(
    request: ShippingCalculationRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Calculate shipping costs for given items and shipping address.
    Returns available shipping methods with costs.
    """
    return await calculate_shipping_cost(request)


@router.post("/orders/{order_id}/shipping", response_model=Dict)
async def apply_shipping_method(
    order_id: UUID = Path(..., description="The ID of the order"),
    method_id: str = Query(..., description="The ID of the shipping method to apply"),
    current_user: Dict = Depends(require_permission("update:orders"))
):
    """
    Apply a shipping method to an order.
    Updates the order with shipping details.
    Requires update:orders permission.
    """
    user_id = UUID(current_user["id"])
    
    # First check if order exists
    await get_order_by_id(order_id)
    
    # Apply shipping method to order
    return await apply_shipping_to_order(order_id, method_id, user_id)


@router.get("/orders/{order_id}", response_model=Dict)
async def get_fulfillment_details(
    order_id: UUID = Path(..., description="The ID of the order"),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get fulfillment details for an order.
    """
    # Get the order with all details
    order = await get_order_by_id(order_id)
    
    # Check permissions (only staff or order owner can view)
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    if str(order["customer_id"]) != str(user_id) and user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order's fulfillment details"
        )
    
    # Return fulfillment-related fields from the order
    return {
        "order_id": order["id"],
        "status": order.get("status"),
        "fulfillment_status": order.get("fulfillment_status", "pending"),
        "shipping_method_id": order.get("shipping_method_id"),
        "shipping_cost": order.get("shipping_cost"),
        "shipping_carrier": order.get("shipping_carrier"),
        "tracking_number": order.get("tracking_number"),
        "estimated_delivery_date": order.get("estimated_delivery_date"),
        "shipping_address": order.get("shipping_address"),
        "customer_id": order.get("customer_id")
    }


@router.get("/picklist/producer/{producer_id}", response_model=PickList)
async def generate_producer_pick_list_endpoint(
    producer_id: UUID = Path(..., description="The ID of the producer"),
    current_user: Dict = Depends(require_permission("read:fulfillment"))
):
    """
    Generate a pick list for a specific producer.
    This would include all pending orders with items from this producer.
    Requires read:fulfillment permission.
    
    The pick list is optimized for efficient picking by grouping items by product
    and sorting by warehouse location.
    """
    return await generate_producer_pick_list(producer_id)


@router.get("/packingslip/order/{order_id}", response_model=PackingSlip)
async def generate_order_packing_slip_endpoint(
    order_id: UUID = Path(..., description="The ID of the order"),
    current_user: Dict = Depends(require_permission("read:fulfillment"))
):
    """
    Generate a packing slip for a specific order.
    Requires read:fulfillment permission.
    
    For MVP, this is a simplified implementation.
    Future versions will include branded templates and more customization.
    """
    return await generate_order_packing_slip(order_id)


@router.get("/orders/{order_id}/validate", response_model=Dict[str, Any])
async def validate_order_for_fulfillment(
    order_id: UUID = Path(..., description="The ID of the order to validate"),
    current_user: Dict = Depends(require_permission("update:fulfillment"))
):
    """
    Validate an order to check if it's ready for fulfillment.
    Returns a detailed validation report.
    Requires update:fulfillment permission.
    """
    _, validation_report = await validate_fulfillment_prerequisites(order_id)
    return validation_report


@router.post("/orders/{order_id}/validate/override", response_model=Dict[str, Any])
async def override_fulfillment_validation(
    order_id: UUID = Path(..., description="The ID of the order"),
    override_reason: str = Body(..., embed=True, description="Reason for overriding validation"),
    current_user: Dict = Depends(require_permission("admin"))
):
    """
    Override validation checks for an order to allow fulfillment despite validation failures.
    Only available to administrators.
    Requires admin permission.
    """
    # Run validation to get the report
    _, validation_report = await validate_fulfillment_prerequisites(order_id)
    
    # If already valid, no need to override
    if validation_report.get("is_valid", False):
        return {
            "message": "Order already passes validation checks. No override needed.",
            "validation_report": validation_report
        }
    
    # Apply the override
    user_id = UUID(current_user["id"])
    updated_report = await override_validation(validation_report, user_id, override_reason)
    
    return {
        "message": "Validation checks have been overridden.",
        "validation_report": updated_report
    }


@router.patch("/orders/{order_id}/status", response_model=Dict)
async def update_fulfillment_status_endpoint(
    order_id: UUID = Path(..., description="The ID of the order"),
    status_update: FulfillmentStatusUpdate = Body(...),
    skip_validation: bool = Query(False, description="Skip validation checks (admin only)"),
    current_user: Dict = Depends(require_permission("update:fulfillment"))
):
    """
    Update the fulfillment status of an order.
    Performs validation checks before processing unless explicitly skipped.
    Requires update:fulfillment permission.
    """
    user_id = UUID(current_user["id"])
    
    # Check if user is trying to skip validation but is not an admin
    if skip_validation:
        user_role = current_user.get("role", "").lower()
        if user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can skip validation checks"
            )
    
    # If transitioning to processing, perform pre-validation for regular users
    # For processing status, perform pre-validation unless admin is skipping
    if status_update.status == FulfillmentStatus.PROCESSING and not skip_validation:
        # Run pre-validation
        is_valid, validation_report = await validate_fulfillment_prerequisites(order_id)
        if not is_valid:
            return {
                "order_id": str(order_id),
                "status": "validation_failed",
                "message": "Order failed validation checks and cannot be processed",
                "validation_report": validation_report
            }
            
    # Proceed with status update
    return await update_fulfillment_status(
        order_id=order_id,
        new_status=status_update.status,
        user_id=user_id,
        notes=status_update.notes
    )


@router.get("/orders/{order_id}/history", response_model=List[Dict])
async def get_order_fulfillment_history(
    order_id: UUID = Path(..., description="The ID of the order"),
    current_user: Dict = Depends(require_permission("read:fulfillment"))
):
    """
    Get the fulfillment status history for an order.
    Requires read:fulfillment permission.
    """
    return await get_fulfillment_history(order_id)


@router.get("/orders/by-producer", response_model=Dict[str, Any])
async def get_orders_grouped_by_producer(
    status: Optional[str] = Query(None, description="Filter orders by status (e.g., 'confirmed', 'processing')"),
    fulfillment_status: Optional[str] = Query(None, description="Filter orders by fulfillment status (e.g., 'pending', 'processing')"),
    skip: int = Query(0, description="Number of results to skip for pagination"),
    limit: int = Query(100, description="Maximum number of results to return for pagination"),
    current_user: Dict = Depends(require_permission("read:fulfillment"))
):
    """
    Get orders grouped by producer.
    This endpoint allows for efficient fulfillment by showing which producers have items in which orders.
    Requires read:fulfillment permission.
    """
    return await get_orders_by_producer(
        producer_id=None,
        status=status,
        fulfillment_status=fulfillment_status,
        skip=skip,
        limit=limit
    )


@router.get("/orders/by-producer/{producer_id}", response_model=Dict[str, Any])
async def get_orders_for_producer(
    producer_id: UUID = Path(..., description="The ID of the producer"),
    status: Optional[str] = Query(None, description="Filter orders by status (e.g., 'confirmed', 'processing')"),
    fulfillment_status: Optional[str] = Query(None, description="Filter orders by fulfillment status (e.g., 'pending', 'processing')"),
    skip: int = Query(0, description="Number of results to skip for pagination"),
    limit: int = Query(100, description="Maximum number of results to return for pagination"),
    current_user: Dict = Depends(require_permission("read:fulfillment"))
):
    """
    Get orders for a specific producer.
    This endpoint returns all orders that contain products from the specified producer.
    Useful for producer-specific fulfillment operations.
    Requires read:fulfillment permission.
    """
    return await get_orders_by_producer(
        producer_id=producer_id,
        status=status,
        fulfillment_status=fulfillment_status,
        skip=skip,
        limit=limit
    )


# ==========================================
# Fulfillment Reporting Endpoints
# ==========================================

@router.post("/reports/metrics", response_model=FulfillmentMetricsReport)
async def create_metrics_report(
    filters: FulfillmentReportFilters,
    current_user: Dict = Depends(require_permission("read:reports"))
):
    """
    Generate a comprehensive metrics report for fulfillment.
    Includes time metrics, accuracy metrics, cost metrics, and volume metrics.
    Requires read:reports permission.
    """
    return await generate_metrics_report(filters)


@router.post("/reports/performance", response_model=FulfillmentPerformanceReport)
async def create_performance_report(
    filters: FulfillmentReportFilters,
    current_user: Dict = Depends(require_permission("read:reports"))
):
    """
    Generate a performance report for fulfillment operations.
    Includes producer performance, shipping method performance, and areas for improvement.
    Requires read:reports permission.
    """
    return await generate_performance_report(filters)


@router.post("/reports/exceptions", response_model=FulfillmentExceptionReport)
async def create_exception_report(
    filters: FulfillmentReportFilters,
    current_user: Dict = Depends(require_permission("read:reports"))
):
    """
    Generate a report on fulfillment exceptions and issues.
    Includes exception types, order exceptions, and resolution metrics.
    Requires read:reports permission.
    """
    return await generate_exception_report(filters)


@router.post("/reports/export")
async def export_report_endpoint(
    export_request: ReportExportRequest,
    current_user: Dict = Depends(require_permission("read:reports"))
):
    """
    Export a report in the specified format.
    Currently supports CSV and JSON formats.
    PDF and Excel formats are planned for future versions.
    Requires read:reports permission.
    """
    content, content_type = await export_report(
        export_request.report_id,
        export_request.format,
        export_request.include_charts
    )
    
    # Generate a filename based on report ID and format
    filename = f"fulfillment_report_{export_request.report_id}.{export_request.format.lower()}"
    
    # Return the file as a downloadable response
    from fastapi.responses import Response
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f"attachment;filename={filename}"
        }
    )


@router.post("/reports/schedule", response_model=Dict[str, Any])
async def schedule_report_endpoint(
    report_type: str = Query(..., description="Type of report to schedule: 'metrics', 'performance', or 'exceptions'"),
    frequency: str = Query(..., description="Frequency of report generation: 'daily', 'weekly', or 'monthly'"),
    format: str = Query("json", description="Format to generate the report in: 'json', 'csv', 'pdf', or 'excel'"),
    filters: FulfillmentReportFilters = Body(...),
    recipients: List[Dict[str, Any]] = Body(...),
    current_user: Dict = Depends(require_permission("manage:reports"))
):
    """
    Schedule a report for regular generation and distribution.
    Reports can be scheduled daily, weekly, or monthly.
    Requires manage:reports permission.
    """
    return await schedule_report(
        report_type=report_type,
        frequency=frequency,
        recipients=recipients,
        filters=filters,
        format=format
    ) 