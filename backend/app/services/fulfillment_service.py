"""
Fulfillment service module for handling order fulfillment operations.
"""
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import HTTPException, status
from decimal import Decimal

from app.services.supabase import get_supabase_client
from app.schemas.fulfillment import PickList, PickListItem, FulfillmentStatus, PackingSlip, PackingSlipItem
from app.services.validation_service import (
    validate_fulfillment_prerequisites,
    validate_status_transition
)
from app.services.notification_service import (
    NotificationType,
    NotificationService
)


async def generate_producer_pick_list(producer_id: UUID) -> PickList:
    """
    Generate a pick list for a specific producer.
    This includes all pending orders with items from this producer.
    
    Args:
        producer_id: UUID of the producer
        
    Returns:
        PickList: Formatted pick list with grouped and sorted items
    """
    supabase = get_supabase_client()
    
    # 1. Get producer information
    producer_response = supabase.table("producer_profiles").select("*").eq("id", str(producer_id)).execute()
    
    if producer_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching producer: {producer_response.error.message}"
        )
    
    if not producer_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer with ID '{producer_id}' not found"
        )
    
    producer = producer_response.data[0]
    
    # Get the producer's name from users table
    user_response = supabase.table("users").select("full_name, company_name").eq("id", str(producer_id)).execute()
    producer_name = "Unknown Producer"
    if user_response.data:
        # Use company name if available, otherwise use full name
        producer_name = user_response.data[0].get("company_name") or user_response.data[0].get("full_name") or producer_name
    
    # 2. Find all pending orders that include products from this producer
    # First get all products from this producer
    producer_products_response = supabase.table("products").select("id").eq("producer_id", str(producer_id)).execute()
    
    if producer_products_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching producer products: {producer_products_response.error.message}"
        )
    
    if not producer_products_response.data:
        # No products found for this producer
        return PickList(
            id=uuid4(),  # Generate a proper UUID
            producer_id=producer_id,
            producer_name=producer_name,
            created_at=datetime.now(),
            items=[],
            total_items=0,
            notes="No products found for this producer"
        )
    
    # Extract product IDs for querying
    product_ids = [str(product["id"]) for product in producer_products_response.data]
    
    # 3. Find pending orders containing these products
    # First we need to find order_items for these products
    order_items_query = supabase.table("order_items").select("*").in_("product_id", product_ids).execute()
    
    if order_items_query.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order items: {order_items_query.error.message}"
        )
    
    if not order_items_query.data:
        # No orders with these products
        return PickList(
            id=uuid4(),  # Generate a proper UUID
            producer_id=producer_id,
            producer_name=producer_name,
            created_at=datetime.now(),
            items=[],
            total_items=0,
            notes="No pending orders for this producer's products"
        )
    
    # Get order IDs for these items
    order_ids = list(set(str(item["order_id"]) for item in order_items_query.data))
    
    # 4. Get pending orders
    pending_orders_response = supabase.table("orders")\
        .select("*")\
        .in_("id", order_ids)\
        .eq("status", "confirmed")\
        .in_("fulfillment_status", ["pending", "processing"])\
        .execute()
    
    if pending_orders_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending orders: {pending_orders_response.error.message}"
        )
    
    if not pending_orders_response.data:
        # No pending orders
        return PickList(
            id=uuid4(),  # Generate a proper UUID
            producer_id=producer_id,
            producer_name=producer_name,
            created_at=datetime.now(),
            items=[],
            total_items=0,
            notes="No pending orders that need fulfillment"
        )
    
    # Filter order_items to only include those for pending orders
    pending_order_ids = [order["id"] for order in pending_orders_response.data]
    pending_order_items = [item for item in order_items_query.data if item["order_id"] in pending_order_ids]
    
    # 5. Fetch complete product details for these items
    product_details = {}
    for product_id in product_ids:
        product_response = supabase.table("products").select("*").eq("id", product_id).execute()
        if not product_response.error and product_response.data:
            product_details[product_id] = product_response.data[0]
    
    # 6. Group by product and sum quantities
    product_quantities = {}
    for item in pending_order_items:
        product_id = item["product_id"]
        if product_id in product_quantities:
            product_quantities[product_id] += item["quantity"]
        else:
            product_quantities[product_id] = item["quantity"]
    
    # 7. Generate pick list items
    pick_list_items = []
    for product_id, quantity in product_quantities.items():
        if product_id in product_details:
            product = product_details[product_id]
            # Extract location and notes if available
            location = product.get("location", None)
            special_instructions = None
            
            # Check metadata for special handling instructions
            metadata = product.get("metadata", {})
            if metadata and isinstance(metadata, dict):
                special_instructions = metadata.get("special_handling")
            
            pick_list_items.append(
                PickListItem(
                    product_id=UUID(product_id),
                    product_name=product.get("name", "Unknown Product"),
                    sku=product.get("sku"),
                    quantity=quantity,
                    location=location,
                    notes=special_instructions
                )
            )
    
    # 8. Sort items by location if available for optimal picking route
    # Simple sort for MVP, can be enhanced with more complex algorithms later
    pick_list_items.sort(key=lambda x: (x.location or "ZZZ", x.product_name))
    
    # 9. Create pick list with a proper UUID
    pick_list = PickList(
        id=uuid4(),  # Generate a random UUID
        producer_id=producer_id,
        producer_name=producer_name,
        created_at=datetime.now(),
        items=pick_list_items,
        total_items=len(pick_list_items),
        status=FulfillmentStatus.PENDING
    )
    
    # 10. Send notification about the pick list if there are items to fulfill
    if len(pick_list_items) > 0:
        try:
            # Use the pick list ID as the reference for the notification
            await NotificationService.notify_fulfillment_request(
                None,  # No specific order ID since this is a consolidated pick list
                producer_id,
                pick_list.id
            )
        except Exception as e:
            # Log error but don't fail the pick list generation if notification fails
            print(f"Error sending producer pick list notification: {str(e)}")
    
    return pick_list


async def generate_order_packing_slip(order_id: UUID) -> PackingSlip:
    """
    Generate a packing slip for a specific order.
    
    Args:
        order_id: UUID of the order
        
    Returns:
        PackingSlip: Formatted packing slip with order and item details
    """
    supabase = get_supabase_client()
    
    # 1. Get order details
    order_response = supabase.table("orders").select("*").eq("id", str(order_id)).execute()
    
    if order_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order: {order_response.error.message}"
        )
    
    if not order_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID '{order_id}' not found"
        )
    
    order = order_response.data[0]
    
    # Check order status - only generate packing slips for appropriate order statuses
    valid_statuses = ["confirmed", "processing", "shipped"]
    if order.get("status") not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot generate packing slip for order with status '{order.get('status')}'. Order must be in one of these statuses: {', '.join(valid_statuses)}"
        )
    
    # 2. Get order items
    order_items_response = supabase.table("order_items").select("*").eq("order_id", str(order_id)).execute()
    
    if order_items_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order items: {order_items_response.error.message}"
        )
    
    if not order_items_response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order with ID '{order_id}' has no items"
        )
    
    order_items = order_items_response.data
    
    # 3. Get customer details
    customer_id = order.get("customer_id")
    customer_response = supabase.table("users").select("full_name, email").eq("id", customer_id).execute()
    
    customer_name = "Customer"
    customer_email = None
    
    if not customer_response.error and customer_response.data:
        customer = customer_response.data[0]
        customer_name = customer.get("full_name", "Customer")
        customer_email = customer.get("email")
    
    # 4. Prepare packing slip items
    packing_slip_items = []
    for item in order_items:
        # Convert string values to proper types
        unit_price = Decimal(str(item.get("unit_price", "0")))
        total_price = Decimal(str(item.get("total_price", "0")))
        
        packing_slip_items.append(
            PackingSlipItem(
                product_id=UUID(item["product_id"]),
                product_name=item["product_name"],
                sku=item.get("sku"),
                quantity=item["quantity"],
                unit_price=unit_price,
                total_price=total_price
            )
        )
    
    # 5. Calculate totals
    subtotal = sum(item.total_price for item in packing_slip_items)
    shipping_cost = Decimal(str(order.get("shipping_cost", "0")))
    total_amount = subtotal + shipping_cost
    
    # Check for special shipping or pickup instructions
    pickup_instructions = None
    if order.get("metadata") and isinstance(order["metadata"], dict):
        pickup_instructions = order["metadata"].get("pickup_instructions")
    
    # Company info and policies
    company_notes = "Thank you for your order! If you have any questions, please contact customer service."
    if order.get("shipping_method_id") == "pickup":
        company_notes += " For local pickup, please bring a valid ID."
    
    # 6. Create packing slip with a proper UUID
    packing_slip = PackingSlip(
        id=uuid4(),
        order_id=order_id,
        order_number=order.get("order_number", str(order_id)),
        customer_name=customer_name,
        customer_email=customer_email,
        shipping_address=order.get("shipping_address"),
        billing_address=order.get("billing_address"),
        items=packing_slip_items,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        tax=Decimal(str(order.get("tax", "0"))),
        total=total_amount,
        payment_method=order.get("payment_method", "Unknown"),
        shipping_method=order.get("shipping_method", "Unknown"),
        created_at=datetime.now(),
        company_info=company_notes,
        return_policy=order.get("return_policy"),
        notes=order.get("notes"),
        additional_info=pickup_instructions
    )
    
    # Notify producers about the packing slip generation
    try:
        # Get producer ID from the order items
        product_response = None
        producer_id = None
        
        # Find first product in the order and get its producer
        if order_items_response.data:
            product_id = order_items_response.data[0].get("product_id")
            if product_id:
                product_response = supabase.table("products").select("producer_id").eq("id", product_id).execute()
                if not product_response.error and product_response.data:
                    producer_id = product_response.data[0].get("producer_id")
        
        # Send packing slip notification if we found a producer
        if producer_id:
            shipping_carrier = order.get("shipping_carrier", "Standard Shipping")
            tracking_number = order.get("tracking_number", "N/A")
            delivery_date = order.get("estimated_delivery_date")
            
            if order.get("shipping_method") == "pickup":
                # Special notification for pickup orders
                await NotificationService.notify_status_update(
                    order_id,
                    producer_id,
                    "ready_for_pickup",
                    "Order is ready for customer pickup. Please prepare the items."
                )
            else:
                # Standard shipping notification
                await NotificationService.notify_shipping_confirmation(
                    order_id,
                    producer_id,
                    shipping_carrier,
                    tracking_number,
                    delivery_date
                )
    except Exception as e:
        # Log error but don't fail the packing slip generation if notification fails
        print(f"Error sending packing slip notification: {str(e)}")
    
    return packing_slip


async def get_orders_by_producer(
    producer_id: Optional[UUID] = None, 
    status: Optional[str] = None,
    fulfillment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Get orders grouped by producer or for a specific producer.
    
    Args:
        producer_id: Optional UUID of a specific producer
        status: Optional filter for order status
        fulfillment_status: Optional filter for fulfillment status
        skip: Number of results to skip (pagination)
        limit: Maximum number of results to return (pagination)
        
    Returns:
        Dict: Object containing producers and their orders
    """
    supabase = get_supabase_client()
    
    # Step 1: Get all relevant products
    products_query = supabase.table("products").select("id,name,producer_id")
    
    if producer_id:
        products_query = products_query.eq("producer_id", str(producer_id))
    
    products_response = products_query.execute()
    
    if products_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching products: {products_response.error.message}"
        )
    
    if not products_response.data:
        if producer_id:
            return {
                "producer_id": producer_id,
                "orders": [],
                "total_orders": 0,
                "message": "No products found for this producer"
            }
        else:
            return {
                "producers": [],
                "total_producers": 0,
                "message": "No products found"
            }
    
    # Group products by producer_id
    products_by_producer = {}
    product_ids = []
    
    for product in products_response.data:
        prod_id = product["id"]
        producer_id = product["producer_id"]
        
        product_ids.append(prod_id)
        
        if producer_id not in products_by_producer:
            products_by_producer[producer_id] = []
            
        products_by_producer[producer_id].append(product)
    
    # Step 2: Find order items containing these products
    if not product_ids:
        if producer_id:
            return {
                "producer_id": producer_id,
                "orders": [],
                "total_orders": 0,
                "message": "No products found for this producer"
            }
        else:
            return {
                "producers": [],
                "total_producers": 0,
                "message": "No products found"
            }
    
    order_items_query = supabase.table("order_items").select("*").in_("product_id", product_ids).execute()
    
    if order_items_query.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order items: {order_items_query.error.message}"
        )
    
    if not order_items_query.data:
        if producer_id:
            return {
                "producer_id": producer_id,
                "orders": [],
                "total_orders": 0,
                "message": "No orders found for this producer's products"
            }
        else:
            return {
                "producers": [],
                "total_producers": 0,
                "message": "No orders found for any producers"
            }
    
    # Get order IDs from order items
    order_ids = list(set(str(item["order_id"]) for item in order_items_query.data))
    
    # Step 3: Get the orders with those IDs
    orders_query = supabase.table("orders").select("*").in_("id", order_ids)
    
    # Apply status filter if provided
    if status:
        orders_query = orders_query.eq("status", status)
    
    # Apply fulfillment status filter if provided
    if fulfillment_status:
        orders_query = orders_query.eq("fulfillment_status", fulfillment_status)
    
    # Apply pagination
    orders_query = orders_query.order("created_at", desc=True).range(skip, skip + limit - 1)
    
    orders_response = orders_query.execute()
    
    if orders_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching orders: {orders_response.error.message}"
        )
    
    if not orders_response.data:
        if producer_id:
            return {
                "producer_id": producer_id,
                "orders": [],
                "total_orders": 0,
                "message": "No orders found matching the specified criteria"
            }
        else:
            return {
                "producers": [],
                "total_producers": 0,
                "message": "No orders found matching the specified criteria"
            }
    
    # Step 4: Group orders by producer
    # We need to determine which producers have items in which orders
    orders_by_producer = {}
    
    # First, create a mapping from order_id to order object
    order_map = {order["id"]: order for order in orders_response.data}
    
    # Group order items by order_id
    order_items_by_order = {}
    for item in order_items_query.data:
        order_id = item["order_id"]
        if order_id not in order_items_by_order:
            order_items_by_order[order_id] = []
        order_items_by_order[order_id].append(item)
    
    # For each product in an order, add that order to the appropriate producer
    for order_id, items in order_items_by_order.items():
        # Skip if order not in filtered results
        if order_id not in order_map:
            continue
            
        order = order_map[order_id]
        
        # Find which producers have items in this order
        producers_in_order = set()
        for item in items:
            product_id = item["product_id"]
            # Find the producer of this product
            for p_id, products in products_by_producer.items():
                if any(p["id"] == product_id for p in products):
                    producers_in_order.add(p_id)
        
        # Add this order to each producer's list
        for p_id in producers_in_order:
            if p_id not in orders_by_producer:
                orders_by_producer[p_id] = []
            
            # Check if we've already added this order to this producer
            if not any(o["id"] == order_id for o in orders_by_producer[p_id]):
                # Add order with its items
                order_with_items = order.copy()
                order_with_items["items"] = [
                    item for item in items 
                    if any(p["id"] == item["product_id"] for p in products_by_producer[p_id])
                ]
                orders_by_producer[p_id].append(order_with_items)
    
    # Step 5: Get producer names and details
    producer_ids = list(orders_by_producer.keys())
    
    if not producer_ids:
        if producer_id:
            return {
                "producer_id": producer_id,
                "orders": [],
                "total_orders": 0,
                "message": "No orders found for this producer with the specified criteria"
            }
        else:
            return {
                "producers": [],
                "total_producers": 0,
                "message": "No orders found for any producers with the specified criteria"
            }
    
    producers_response = supabase.table("users").select("id,full_name,company_name").in_("id", producer_ids).execute()
    
    producer_details = {}
    if not producers_response.error and producers_response.data:
        for producer in producers_response.data:
            p_id = producer["id"]
            # Use company name if available, otherwise use full name
            producer_name = producer.get("company_name") or producer.get("full_name") or "Unknown Producer"
            producer_details[p_id] = {
                "id": p_id,
                "name": producer_name
            }
    
    # Step 6: Format the response based on whether we're requesting a specific producer or all
    if producer_id:
        # Single producer response
        producer_orders = orders_by_producer.get(str(producer_id), [])
        result = {
            "producer_id": producer_id,
            "producer_name": producer_details.get(str(producer_id), {}).get("name", "Unknown Producer"),
            "orders": producer_orders,
            "total_orders": len(producer_orders)
        }
        
        # Notify producer about any new orders they haven't been notified about yet
        try:
            # Look for confirmed orders that haven't had fulfillment started
            new_orders = [order for order in producer_orders 
                          if order.get("status") == "confirmed" and 
                          order.get("fulfillment_status") in ["pending", None]]
            
            # Send new order notifications
            for order in new_orders:
                # Check if notification already sent by looking for a notification history entry
                notification_check = supabase.table("notification_history")\
                    .select("id")\
                    .eq("entity_id", str(order.get("id")))\
                    .eq("notification_type", "new_order")\
                    .eq("recipient_id", str(producer_id))\
                    .execute()
                
                # Only notify if no previous notification found
                if not notification_check.error and not notification_check.data:
                    await NotificationService.notify_new_order(
                        UUID(order.get("id")),
                        producer_id
                    )
        except Exception as e:
            # Log error but don't fail the order retrieval if notification fails
            print(f"Error sending new order notifications: {str(e)}")
        
        return result
    else:
        # All producers response
        formatted_producers = []
        for p_id, orders in orders_by_producer.items():
            producer_info = producer_details.get(p_id, {"id": p_id, "name": "Unknown Producer"})
            formatted_producers.append({
                "id": p_id,
                "name": producer_info["name"],
                "orders": orders,
                "total_orders": len(orders)
            })
        
        return {
            "producers": formatted_producers,
            "total_producers": len(formatted_producers),
            "pagination": {
                "total": len(formatted_producers),
                "skip": skip,
                "limit": limit
            }
        }


async def update_fulfillment_status(
    order_id: UUID,
    new_status: str,
    user_id: UUID,
    notes: Optional[str] = None
) -> Dict:
    """
    Update the fulfillment status of an order.
    
    Args:
        order_id: UUID of the order
        new_status: New fulfillment status
        user_id: UUID of the user making the change
        notes: Optional notes about the status change
        
    Returns:
        Dict: Updated order with new status
    """
    supabase = get_supabase_client()
    
    # 1. Get current order status
    order_response = supabase.table("orders").select("*").eq("id", str(order_id)).execute()
    
    if order_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order: {order_response.error.message}"
        )
    
    if not order_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID '{order_id}' not found"
        )
    
    order = order_response.data[0]
    current_status = order.get("fulfillment_status", "pending")
    
    # 2. Validate status transition
    is_valid, validation_errors = await validate_status_transition(order_id, current_status, new_status)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current_status}' to '{new_status}': {validation_errors}"
        )
    
    # 3. Update order status
    update_data = {
        "fulfillment_status": new_status
    }
    
    # For some status changes, we also update the main order status
    if new_status == FulfillmentStatus.SHIPPED:
        update_data["status"] = "shipped"
    elif new_status == FulfillmentStatus.DELIVERED:
        update_data["status"] = "delivered"
    elif new_status == FulfillmentStatus.CANCELLED:
        update_data["status"] = "cancelled"
    
    update_response = supabase.table("orders").update(update_data).eq("id", str(order_id)).execute()
    
    if update_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating order status: {update_response.error.message}"
        )
    
    # 4. Create history entry
    history_entry = {
        "order_id": str(order_id),
        "previous_status": current_status,
        "new_status": new_status,
        "user_id": str(user_id),
        "notes": notes or f"Status changed from {current_status} to {new_status}",
        "created_at": datetime.now().isoformat()
    }
    
    history_response = supabase.table("fulfillment_history").insert(history_entry).execute()
    
    if history_response.error:
        # Log error but continue (don't fail the status update just because history logging failed)
        print(f"Error creating fulfillment history entry: {history_response.error.message}")
    
    updated_order = update_response.data[0] if update_response.data else {"id": str(order_id), "fulfillment_status": new_status}

    # 5. Send notification to the producer
    try:
        # Get producer ID from the order items
        product_response = None
        order_items_response = supabase.table("order_items").select("*").eq("order_id", str(order_id)).execute()
        if not order_items_response.error and order_items_response.data:
            # Get first product's producer_id
            product_id = order_items_response.data[0].get("product_id")
            if product_id:
                product_response = supabase.table("products").select("producer_id").eq("id", product_id).execute()
        
        producer_id = None
        if product_response and product_response.data:
            producer_id = product_response.data[0].get("producer_id")
        
        if producer_id:
            status_message = notes or f"Order status updated to {new_status}"
            
            # Send appropriate notification based on status
            if new_status == FulfillmentStatus.PROCESSING:
                await NotificationService.notify_fulfillment_request(order_id, producer_id, None)
            elif new_status in [FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERING, FulfillmentStatus.DELIVERED, FulfillmentStatus.CANCELLED]:
                await NotificationService.notify_status_update(order_id, producer_id, new_status, status_message)
            elif new_status == FulfillmentStatus.COMPLETED:
                await NotificationService.notify_order_completion(order_id, producer_id)
    except Exception as e:
        # Log error but don't fail the status update if notification fails
        print(f"Error sending producer notification: {str(e)}")
    
    return updated_order


async def get_fulfillment_history(order_id: UUID) -> List[Dict]:
    """
    Get the history of fulfillment status changes for an order.
    
    Args:
        order_id: UUID of the order
        
    Returns:
        List[Dict]: History records for fulfillment status changes
    """
    supabase = get_supabase_client()
    
    history_response = supabase.table("fulfillment_history")\
        .select("*")\
        .eq("order_id", str(order_id))\
        .order("created_at", desc=False)\
        .execute()
    
    if history_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching fulfillment history: {history_response.error.message}"
        )
    
    return history_response.data 