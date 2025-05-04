"""
Orders API endpoints module.
This module handles all API operations related to orders.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Optional, Dict, Any
from uuid import UUID

from app.middleware.auth import get_current_user, require_permission
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderWithItems, OrderWithDetails,
    OrderNoteCreate, OrderNoteResponse
)
from app.services.order_service import (
    get_orders, get_order_by_id, create_order, update_order,
    delete_order, add_order_note
)
from app.services.order_status_service import (
    transition_order_status, get_valid_status_transitions,
    get_status_timeline
)


router = APIRouter()


@router.get("/", response_model=List[OrderWithItems])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by order status"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    current_user: Dict = Depends(require_permission("read:orders"))
):
    """
    Get a list of orders with pagination and filtering support.
    Requires read:orders permission.
    """
    return await get_orders(skip=skip, limit=limit, customer_id=customer_id, status=status)


@router.get("/my", response_model=List[OrderWithItems])
async def list_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by order status"),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get a list of the current user's orders with pagination and filtering.
    All authenticated users can view their own orders.
    """
    user_id = UUID(current_user["id"])
    return await get_orders(skip=skip, limit=limit, customer_id=user_id, status=status)


@router.get("/{order_id}", response_model=OrderWithDetails)
async def get_order(
    order_id: UUID = Path(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get a specific order by ID.
    Users can view their own orders. Staff can view any order.
    """
    order = await get_order_by_id(order_id)
    
    # Check if user has permission to view this order
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    if str(order["customer_id"]) != str(user_id) and user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order"
        )
    
    return order


@router.get("/{order_id}/timeline", response_model=List[Dict])
async def get_order_timeline(
    order_id: UUID = Path(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get a timeline of status changes for an order.
    Users can view their own order timeline. Staff can view any order timeline.
    """
    # First check if user has permission to view this order
    order = await get_order_by_id(order_id)
    
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    if str(order["customer_id"]) != str(user_id) and user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order"
        )
    
    return await get_status_timeline(order_id)


@router.get("/{order_id}/status/transitions", response_model=List[str])
async def get_available_status_transitions(
    order_id: UUID = Path(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get the list of valid status transitions for an order.
    Users can view transitions for their own orders. Staff can view for any order.
    """
    # First check if user has permission to view this order
    order = await get_order_by_id(order_id)
    
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    if str(order["customer_id"]) != str(user_id) and user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this order"
        )
    
    return await get_valid_status_transitions(order["status"])


@router.post("/", response_model=OrderWithItems, status_code=status.HTTP_201_CREATED)
async def create_new_order(
    order_data: OrderCreate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Create a new order.
    All authenticated users can create orders.
    """
    user_id = UUID(current_user["id"])
    
    # If customer_id is not the current user and user is not admin/staff, reject
    user_role = current_user.get("role", "").lower()
    if str(order_data.customer_id) != str(user_id) and user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create orders for yourself"
        )
    
    return await create_order(order_data, user_id)


@router.put("/{order_id}", response_model=OrderWithDetails)
async def update_existing_order(
    order_id: UUID = Path(...),
    order_data: OrderUpdate = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Update an existing order.
    Users can update their own orders' notes. Staff can update any order.
    """
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    # Get the order to check ownership
    order = await get_order_by_id(order_id)
    
    # If not owner and not staff, reject unless just updating notes
    if str(order["customer_id"]) != str(user_id) and user_role not in ["admin", "staff"]:
        # Customers can only update their notes
        if any(key != "notes" for key in order_data.dict(exclude_none=True).keys()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update notes for your own orders"
            )
    
    # If status is changing, use the status transition service
    if order_data.status and order_data.status != order["status"]:
        return await transition_order_status(
            order_id=order_id,
            new_status=order_data.status,
            user_id=user_id,
            user_role=user_role,
            notes=order_data.notes
        )
    
    return await update_order(order_id, order_data, user_id)


@router.patch("/{order_id}/status", response_model=OrderWithDetails)
async def update_order_status_endpoint(
    order_id: UUID = Path(...),
    status_data: Dict[str, str] = Body(..., example={"status": "processing", "notes": "Optional notes"}),
    current_user: Dict = Depends(get_current_user)
):
    """
    Update an order's status.
    Uses the order status management service to validate transitions.
    """
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    new_status = status_data.get("status")
    notes = status_data.get("notes")
    
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status is required"
        )
    
    return await transition_order_status(
        order_id=order_id,
        new_status=new_status,
        user_id=user_id,
        user_role=user_role,
        notes=notes
    )


@router.post("/{order_id}/notes", response_model=OrderNoteResponse)
async def add_note_to_order(
    order_id: UUID = Path(...),
    note_data: OrderNoteCreate = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Add a note to an order.
    Users can add notes to their own orders. Staff can add notes to any order.
    Staff can add internal notes.
    """
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    # Get the order to check ownership
    order = await get_order_by_id(order_id)
    
    # If not owner and not staff, reject
    if str(order["customer_id"]) != str(user_id) and user_role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add notes to your own orders"
        )
    
    # If not staff, ensure is_internal is false
    if user_role not in ["admin", "staff"] and note_data.is_internal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot create internal notes"
        )
    
    return await add_order_note(order_id, note_data, user_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_order(
    order_id: UUID = Path(...),
    current_user: Dict = Depends(require_permission("delete:orders"))
):
    """
    Delete an order.
    Requires delete:orders permission.
    """
    await delete_order(order_id)
    return None


@router.patch("/{order_id}/cancel", response_model=OrderWithDetails)
async def cancel_order_endpoint(
    order_id: UUID = Path(...),
    cancel_data: Dict[str, Optional[str]] = Body(..., example={"reason": "Customer requested cancellation"}),
    current_user: Dict = Depends(get_current_user)
):
    """
    Cancel an order.
    Users can cancel their own orders. Staff can cancel any order.
    """
    user_id = UUID(current_user["id"])
    user_role = current_user.get("role", "").lower()
    
    reason = cancel_data.get("reason", "No reason provided")
    notes = f"Order cancelled. Reason: {reason}"
    
    return await transition_order_status(
        order_id=order_id,
        new_status="cancelled",
        user_id=user_id,
        user_role=user_role,
        notes=notes
    ) 