"""
Order status management service.
Handles order status transitions, validation, and business logic.
"""
from enum import Enum
from fastapi import HTTPException, status
from typing import Dict, Optional, Set, List, Tuple
from uuid import UUID

from app.services.order_service import get_order_by_id, update_order
from app.schemas.order import OrderUpdate


class OrderStatus(str, Enum):
    """Valid order statuses"""
    NEW = "new"
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class PaymentStatus(str, Enum):
    """Valid payment statuses"""
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"


# Define valid status transitions
# Each status can only transition to specific other statuses
VALID_STATUS_TRANSITIONS = {
    OrderStatus.NEW: {OrderStatus.PENDING, OrderStatus.CANCELLED},
    OrderStatus.PENDING: {OrderStatus.PROCESSING, OrderStatus.CANCELLED},
    OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.RETURNED},
    OrderStatus.DELIVERED: {OrderStatus.RETURNED},
    OrderStatus.CANCELLED: set(),  # Terminal state
    OrderStatus.RETURNED: set()  # Terminal state
}

# Define roles that can perform each transition
STATUS_TRANSITION_ROLES = {
    (OrderStatus.NEW, OrderStatus.PENDING): {"customer", "staff", "admin"},
    (OrderStatus.NEW, OrderStatus.CANCELLED): {"customer", "staff", "admin"},
    (OrderStatus.PENDING, OrderStatus.PROCESSING): {"staff", "admin"},
    (OrderStatus.PENDING, OrderStatus.CANCELLED): {"customer", "staff", "admin"},
    (OrderStatus.PROCESSING, OrderStatus.SHIPPED): {"staff", "admin"},
    (OrderStatus.PROCESSING, OrderStatus.CANCELLED): {"staff", "admin"},
    (OrderStatus.SHIPPED, OrderStatus.DELIVERED): {"staff", "admin"},
    (OrderStatus.SHIPPED, OrderStatus.RETURNED): {"staff", "admin"},
    (OrderStatus.DELIVERED, OrderStatus.RETURNED): {"customer", "staff", "admin"}
}

# Define status descriptions for UI and notifications
STATUS_DESCRIPTIONS = {
    OrderStatus.NEW: "Order has been created but not yet confirmed.",
    OrderStatus.PENDING: "Order has been confirmed and is awaiting processing.",
    OrderStatus.PROCESSING: "Order is being prepared for shipping.",
    OrderStatus.SHIPPED: "Order has been shipped and is in transit.",
    OrderStatus.DELIVERED: "Order has been delivered to the customer.",
    OrderStatus.CANCELLED: "Order has been cancelled.",
    OrderStatus.RETURNED: "Order has been returned by the customer."
}


async def get_valid_status_transitions(current_status: str) -> List[str]:
    """
    Get the list of valid status transitions from the current status.
    """
    try:
        current = OrderStatus(current_status)
        return [status.value for status in VALID_STATUS_TRANSITIONS.get(current, set())]
    except ValueError:
        # If current status is not valid, return empty list
        return []


async def can_transition_status(
    current_status: str,
    new_status: str,
    user_role: str
) -> Tuple[bool, str]:
    """
    Check if a status transition is valid based on current status,
    new status, and user role.
    
    Returns a tuple of (is_valid, reason)
    """
    try:
        current = OrderStatus(current_status)
        new = OrderStatus(new_status)
    except ValueError:
        return False, "Invalid status value"
    
    # Check if transition is valid
    if new not in VALID_STATUS_TRANSITIONS.get(current, set()):
        valid_transitions = ", ".join([s.value for s in VALID_STATUS_TRANSITIONS.get(current, set())])
        return False, f"Cannot transition from '{current}' to '{new}'. Valid transitions: {valid_transitions}"
    
    # Check if user has permission for this transition
    if user_role not in STATUS_TRANSITION_ROLES.get((current, new), set()):
        return False, f"User with role '{user_role}' cannot transition from '{current}' to '{new}'"
    
    return True, ""


async def transition_order_status(
    order_id: UUID,
    new_status: str,
    user_id: UUID,
    user_role: str,
    notes: Optional[str] = None
) -> Dict:
    """
    Transition an order to a new status with validation and business logic.
    """
    # Get the current order
    order = await get_order_by_id(order_id)
    current_status = order.get("status")
    
    # Validate the transition
    is_valid, reason = await can_transition_status(current_status, new_status, user_role)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason
        )
    
    # Create descriptive notes if not provided
    transition_notes = notes
    if not transition_notes:
        current_desc = STATUS_DESCRIPTIONS.get(OrderStatus(current_status), "")
        new_desc = STATUS_DESCRIPTIONS.get(OrderStatus(new_status), "")
        transition_notes = f"Status changed from '{current_status}' ({current_desc}) to '{new_status}' ({new_desc})"
    
    # Handle business logic for specific transitions
    payment_status = None
    if new_status == OrderStatus.CANCELLED.value and order.get("payment_status") == PaymentStatus.PAID.value:
        # If cancelling a paid order, automatically update payment status to refunded
        payment_status = PaymentStatus.REFUNDED.value
    
    # Update the order status
    update_data = OrderUpdate(
        status=new_status,
        notes=transition_notes
    )
    
    if payment_status:
        update_data.payment_status = payment_status
    
    # Perform the update
    return await update_order(order_id, update_data, user_id)


async def get_order_status_history(order_id: UUID) -> List[Dict]:
    """
    Get the history of status changes for an order.
    """
    order = await get_order_by_id(order_id)
    return order.get("history", [])


async def get_status_timeline(order_id: UUID) -> List[Dict]:
    """
    Get a human-readable timeline of order status changes.
    """
    history = await get_order_status_history(order_id)
    
    timeline = []
    for entry in history:
        new_status = entry.get("new_status")
        description = STATUS_DESCRIPTIONS.get(OrderStatus(new_status), "")
        
        timeline.append({
            "timestamp": entry.get("created_at"),
            "status": new_status,
            "description": description,
            "notes": entry.get("notes"),
            "previous_status": entry.get("previous_status")
        })
    
    return timeline 