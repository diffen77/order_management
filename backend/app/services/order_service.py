"""
Order service for handling database operations related to orders.
"""
from fastapi import HTTPException, status
from typing import Dict, List, Optional, Any
from uuid import UUID
from datetime import datetime

from app.services.supabase import get_supabase_client
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderItemCreate,
    OrderNoteCreate, OrderHistoryCreate
)


async def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    customer_id: Optional[UUID] = None,
    status: Optional[str] = None
) -> List[Dict]:
    """
    Get a list of orders with optional filtering.
    """
    supabase = get_supabase_client()
    query = supabase.table("orders").select("*")
    
    if customer_id:
        query = query.eq("customer_id", str(customer_id))
    
    if status:
        query = query.eq("status", status)
    
    response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    
    if response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching orders: {response.error.message}"
        )
    
    return response.data


async def get_order_by_id(order_id: UUID) -> Dict:
    """
    Get a single order by ID with its items, history, and notes.
    """
    supabase = get_supabase_client()
    
    # Get the order
    order_response = supabase.table("orders").select("*").eq("id", str(order_id)).single().execute()
    
    if order_response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if order_response.error.message == "No rows found" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order: {order_response.error.message}"
        )
    
    order = order_response.data
    
    # Get order items
    items_response = supabase.table("order_items").select("*").eq("order_id", str(order_id)).execute()
    if not items_response.error:
        order["items"] = items_response.data
    
    # Get order history
    history_response = supabase.table("order_history").select("*").eq("order_id", str(order_id)).order("created_at", desc=True).execute()
    if not history_response.error:
        order["history"] = history_response.data
    
    # Get order notes
    notes_response = supabase.table("order_notes").select("*").eq("order_id", str(order_id)).order("created_at", desc=True).execute()
    if not notes_response.error:
        order["order_notes"] = notes_response.data
    
    return order


async def create_order(order: OrderCreate, user_id: UUID) -> Dict:
    """
    Create a new order with items.
    """
    supabase = get_supabase_client()
    
    # Create order
    order_data = order.dict(exclude={"items"})
    
    # Ensure customer_id is set to the user_id if not explicitly provided
    if "customer_id" not in order_data:
        order_data["customer_id"] = str(user_id)
    
    order_response = supabase.table("orders").insert(order_data).execute()
    
    if order_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating order: {order_response.error.message}"
        )
    
    created_order = order_response.data[0]
    order_id = created_order["id"]
    
    # Create order items
    items_data = []
    for item in order.items:
        item_dict = item.dict()
        item_dict["order_id"] = order_id
        items_data.append(item_dict)
    
    if items_data:
        items_response = supabase.table("order_items").insert(items_data).execute()
        
        if items_response.error:
            # Rollback order creation if items insertion fails
            supabase.table("orders").delete().eq("id", order_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating order items: {items_response.error.message}"
            )
        
        created_order["items"] = items_response.data
    
    # Create initial order history entry
    history_data = {
        "order_id": order_id,
        "new_status": created_order["status"],
        "changed_by": str(user_id),
        "notes": "Order created"
    }
    
    supabase.table("order_history").insert(history_data).execute()
    
    return created_order


async def update_order(order_id: UUID, order_update: OrderUpdate, user_id: UUID) -> Dict:
    """
    Update an existing order.
    """
    supabase = get_supabase_client()
    
    # Get the current order
    current_order = await get_order_by_id(order_id)
    
    # Update the order
    update_data = order_update.dict(exclude_none=True)
    
    # If status has changed, create a history record
    if "status" in update_data and update_data["status"] != current_order["status"]:
        history_data = {
            "order_id": str(order_id),
            "previous_status": current_order["status"],
            "new_status": update_data["status"],
            "changed_by": str(user_id),
            "notes": f"Status updated from {current_order['status']} to {update_data['status']}"
        }
        
        history_response = supabase.table("order_history").insert(history_data).execute()
        
        if history_response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating order history: {history_response.error.message}"
            )
    
    # Update the order
    order_response = supabase.table("orders").update(update_data).eq("id", str(order_id)).execute()
    
    if order_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating order: {order_response.error.message}"
        )
    
    if not order_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return await get_order_by_id(order_id)


async def delete_order(order_id: UUID) -> bool:
    """
    Delete an order and all related records.
    """
    supabase = get_supabase_client()
    
    # Delete the order will cascade to items, history, and notes
    response = supabase.table("orders").delete().eq("id", str(order_id)).execute()
    
    if response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting order: {response.error.message}"
        )
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return True


async def add_order_note(order_id: UUID, note: OrderNoteCreate, user_id: UUID) -> Dict:
    """
    Add a note to an order.
    """
    supabase = get_supabase_client()
    
    note_data = note.dict()
    note_data["order_id"] = str(order_id)
    note_data["user_id"] = str(user_id)
    
    response = supabase.table("order_notes").insert(note_data).execute()
    
    if response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding order note: {response.error.message}"
        )
    
    return response.data[0]


async def update_order_status(order_id: UUID, new_status: str, user_id: UUID, notes: Optional[str] = None) -> Dict:
    """
    Update an order's status and create a history record.
    """
    update_data = OrderUpdate(status=new_status)
    if notes:
        update_data.notes = notes
    
    return await update_order(order_id, update_data, user_id) 