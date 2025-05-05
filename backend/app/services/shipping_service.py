"""
Shipping service for handling shipping calculations and provider integrations.
"""
from fastapi import HTTPException, status
from typing import Dict, List, Optional, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timedelta

from app.services.supabase import get_supabase_client
from app.schemas.order import (
    ShippingMethod, ShippingCalculationRequest, 
    ShippingCalculationResponse
)


# Default shipping methods for MVP
DEFAULT_SHIPPING_METHODS = [
    {
        "id": "standard",
        "name": "Standard Shipping",
        "description": "Standard delivery within 3-5 business days",
        "price": Decimal("59.00"),
        "estimated_days": 4,
        "carrier": "PostNord",
        "is_active": True
    },
    {
        "id": "express",
        "name": "Express Shipping",
        "description": "Express delivery within 1-2 business days",
        "price": Decimal("129.00"),
        "estimated_days": 2,
        "carrier": "DHL",
        "is_active": True
    },
    {
        "id": "pickup",
        "name": "Local Pickup",
        "description": "Pickup at local store or collection point",
        "price": Decimal("0.00"),
        "estimated_days": 1,
        "carrier": "Self Pickup",
        "is_active": True
    }
]


async def get_shipping_methods() -> List[ShippingMethod]:
    """
    Get available shipping methods.
    In MVP, this returns hardcoded shipping methods.
    Future implementation will fetch from database or shipping provider API.
    """
    # For MVP, return the default shipping methods
    # In the future, this would fetch from database or external API
    return [ShippingMethod(**method) for method in DEFAULT_SHIPPING_METHODS]


async def get_shipping_method_by_id(method_id: str) -> Optional[ShippingMethod]:
    """
    Get a specific shipping method by ID.
    """
    methods = await get_shipping_methods()
    for method in methods:
        if method.id == method_id:
            return method
    return None


async def calculate_shipping_cost(
    request: ShippingCalculationRequest
) -> ShippingCalculationResponse:
    """
    Calculate shipping costs based on order items and shipping address.
    Returns available shipping methods with costs and estimated delivery.
    """
    # Get available shipping methods
    available_methods = await get_shipping_methods()
    
    # For MVP, we'll return all shipping methods with their base prices
    # In the future, this would calculate based on weight, dimensions, distance, etc.
    
    # Determine a recommended method (for MVP, use standard shipping)
    recommended_method_id = "standard"
    
    # If a specific method was requested, validate it exists
    if request.shipping_method_id:
        method_exists = any(m.id == request.shipping_method_id for m in available_methods)
        if not method_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Shipping method with ID '{request.shipping_method_id}' not found"
            )
        recommended_method_id = request.shipping_method_id
    
    return ShippingCalculationResponse(
        available_methods=available_methods,
        recommended_method_id=recommended_method_id
    )


async def get_estimated_delivery_date(method_id: str) -> datetime:
    """
    Calculate the estimated delivery date based on the shipping method.
    """
    method = await get_shipping_method_by_id(method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shipping method with ID '{method_id}' not found"
        )
    
    # Calculate based on business days (excluding weekends)
    # For MVP, we'll use a simple calculation
    today = datetime.now()
    
    # Add the estimated days
    estimated_date = today + timedelta(days=method.estimated_days)
    
    return estimated_date


async def apply_shipping_to_order(
    order_id: UUID,
    method_id: str,
    user_id: UUID
) -> Dict:
    """
    Apply shipping method and costs to an order.
    Updates the order with shipping details.
    """
    supabase = get_supabase_client()
    
    # Get the shipping method
    method = await get_shipping_method_by_id(method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shipping method with ID '{method_id}' not found"
        )
    
    # Calculate estimated delivery date
    estimated_delivery = await get_estimated_delivery_date(method_id)
    
    # Update the order with shipping information
    update_data = {
        "shipping_method_id": method.id,
        "shipping_cost": float(method.price),  # Convert Decimal to float for Supabase
        "shipping_carrier": method.carrier,
        "estimated_delivery_date": estimated_delivery.isoformat(),
        "fulfillment_status": "pending"
    }
    
    response = supabase.table("orders").update(update_data).eq("id", str(order_id)).execute()
    
    if response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating order with shipping information: {response.error.message}"
        )
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Add a note about the shipping method being applied
    note_data = {
        "order_id": str(order_id),
        "user_id": str(user_id),
        "content": f"Shipping method '{method.name}' applied to order. Estimated delivery: {estimated_delivery.strftime('%Y-%m-%d')}",
        "is_internal": True
    }
    
    supabase.table("order_notes").insert(note_data).execute()
    
    return response.data[0] 