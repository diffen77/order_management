from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from typing import List, Optional
from uuid import UUID

from app.models.customer import (
    Customer, CustomerCreate, CustomerUpdate, CustomerWithDetails,
    CustomerNote, CustomerNoteCreate, CustomerPreferences, CustomerPreferencesCreate,
    CustomerPreferencesUpdate
)
from app.models.order import Order
from app.models.user import User
from app.services.auth import get_current_user
from app.services.customers import (
    get_customers, get_customer_by_id, create_customer, update_customer,
    delete_customer, get_customer_orders, add_customer_note, get_customer_notes,
    get_customer_preferences, create_or_update_customer_preferences
)
from app.utils.logging import setup_logger

logger = setup_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[Customer])
async def list_customers(
    skip: int = Query(0, ge=0, description="Number of customers to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max number of customers to return"),
    search: Optional[str] = Query(None, description="Search term for customer name or email"),
    customer_type: Optional[str] = Query(None, description="Filter by customer type"),
    current_user: User = Depends(get_current_user)
):
    """
    List all customers with pagination, search, and filtering.
    """
    logger.info(f"Getting customers list: skip={skip}, limit={limit}, search={search}, type={customer_type}")
    return await get_customers(skip, limit, search, customer_type)


@router.post("/", response_model=Customer, status_code=status.HTTP_201_CREATED)
async def add_customer(
    customer: CustomerCreate = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new customer.
    """
    logger.info(f"Creating new customer: {customer.email}")
    return await create_customer(customer)


@router.get("/{customer_id}", response_model=CustomerWithDetails)
async def get_customer(
    customer_id: UUID = Path(..., description="The ID of the customer to retrieve"),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific customer.
    """
    logger.info(f"Getting customer details: {customer_id}")
    customer = await get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=Customer)
async def modify_customer(
    customer_id: UUID = Path(..., description="The ID of the customer to update"),
    customer: CustomerUpdate = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Update a customer's information.
    """
    logger.info(f"Updating customer: {customer_id}")
    updated_customer = await update_customer(customer_id, customer)
    if not updated_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated_customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_customer(
    customer_id: UUID = Path(..., description="The ID of the customer to delete"),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a customer.
    """
    logger.info(f"Deleting customer: {customer_id}")
    success = await delete_customer(customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return None


@router.get("/{customer_id}/orders", response_model=List[Order])
async def list_customer_orders(
    customer_id: UUID = Path(..., description="The ID of the customer"),
    skip: int = Query(0, ge=0, description="Number of orders to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max number of orders to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get a customer's order history.
    """
    logger.info(f"Getting orders for customer: {customer_id}")
    customer = await get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return await get_customer_orders(customer_id, skip, limit)


@router.get("/{customer_id}/notes", response_model=List[CustomerNote])
async def list_customer_notes(
    customer_id: UUID = Path(..., description="The ID of the customer"),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notes for a customer.
    """
    logger.info(f"Getting notes for customer: {customer_id}")
    customer = await get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return await get_customer_notes(customer_id)


@router.post("/{customer_id}/notes", response_model=CustomerNote, status_code=status.HTTP_201_CREATED)
async def create_customer_note(
    customer_id: UUID = Path(..., description="The ID of the customer"),
    note: CustomerNoteCreate = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Add a note to a customer.
    """
    if note.customer_id != customer_id:
        raise HTTPException(status_code=400, detail="Customer ID mismatch")
    
    logger.info(f"Adding note for customer: {customer_id}")
    customer = await get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return await add_customer_note(note, current_user.id)


@router.get("/{customer_id}/preferences", response_model=CustomerPreferences)
async def get_preferences(
    customer_id: UUID = Path(..., description="The ID of the customer"),
    current_user: User = Depends(get_current_user)
):
    """
    Get customer preferences.
    """
    logger.info(f"Getting preferences for customer: {customer_id}")
    customer = await get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    preferences = await get_customer_preferences(customer_id)
    if not preferences:
        raise HTTPException(status_code=404, detail="Customer preferences not found")
    
    return preferences


@router.put("/{customer_id}/preferences", response_model=CustomerPreferences)
async def update_preferences(
    customer_id: UUID = Path(..., description="The ID of the customer"),
    preferences: CustomerPreferencesUpdate = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Update customer preferences.
    """
    logger.info(f"Updating preferences for customer: {customer_id}")
    customer = await get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    preferences_create = CustomerPreferencesCreate(
        customer_id=customer_id,
        preferences=preferences.preferences
    )
    
    return await create_or_update_customer_preferences(preferences_create) 