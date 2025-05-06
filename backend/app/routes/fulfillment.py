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
    Fulfillment, PickList, PackingSlip
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


@router.patch("/orders/{order_id}/status", response_model=Dict)
async def update_fulfillment_status_endpoint(
    order_id: UUID = Path(..., description="The ID of the order"),
    status_update: FulfillmentStatusUpdate = Body(...),
    current_user: Dict = Depends(require_permission("update:fulfillment"))
):
    """
    Update the fulfillment status of an order.
    Requires update:fulfillment permission.
    """
    user_id = UUID(current_user["id"])
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