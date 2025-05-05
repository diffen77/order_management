from typing import List, Optional, Dict, Any
from uuid import UUID
import json
import asyncio
from datetime import datetime
from fastapi import HTTPException

from app.models.customer import (
    CustomerCreate, CustomerUpdate, CustomerWithDetails, Customer, 
    CustomerNoteCreate, CustomerNote, CustomerPreferencesCreate, CustomerPreferences
)
from app.models.order import Order
from app.utils.logging import setup_logger
from app.utils.db import execute_query, fetch_one, fetch_all
from app.utils.db_queries import generate_update_query

logger = setup_logger(__name__)


async def get_customers(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None, 
    customer_type: Optional[str] = None
) -> List[Customer]:
    """
    Get a list of customers with optional filtering.
    """
    query = """
    SELECT 
        id, email, full_name, phone, address, postal_code, city, customer_type, 
        created_at, updated_at
    FROM 
        customers 
    WHERE 
        1=1
    """
    params = []
    
    # Add search filter if provided
    if search:
        query += " AND (full_name ILIKE $1 OR email ILIKE $1"
        
        # Check if search term could be a UUID
        is_uuid = False
        try:
            # Try to parse the search term as UUID - this doesn't check database
            UUID(search)
            is_uuid = True
        except ValueError:
            pass
            
        if is_uuid:
            query += " OR id::text = $1"
        else:
            query += " OR phone ILIKE $1"
            
        query += ")"
        params.append(f"%{search}%")
    
    # Add customer type filter if provided
    if customer_type:
        param_index = len(params) + 1
        query += f" AND customer_type = ${param_index}"
        params.append(customer_type)
    
    # Add pagination
    param_skip_index = len(params) + 1
    param_limit_index = len(params) + 2
    query += f" ORDER BY full_name LIMIT ${param_limit_index} OFFSET ${param_skip_index}"
    params.extend([skip, limit])
    
    customers_data = await fetch_all(query, params)
    return [Customer.parse_obj(customer) for customer in customers_data]


async def get_customer_by_id(customer_id: UUID) -> Optional[CustomerWithDetails]:
    """
    Get a specific customer by ID with details.
    """
    # Get customer basic information
    query = """
    SELECT 
        id, email, full_name, phone, address, postal_code, city, customer_type, 
        created_at, updated_at
    FROM 
        customers 
    WHERE 
        id = $1
    """
    customer_data = await fetch_one(query, [customer_id])
    
    if not customer_data:
        return None
    
    # Get customer notes
    notes_query = """
    SELECT 
        id, customer_id, content, created_by, created_at 
    FROM 
        customer_notes 
    WHERE 
        customer_id = $1
    ORDER BY 
        created_at DESC
    """
    notes_data = await fetch_all(notes_query, [customer_id])
    notes = [CustomerNote.parse_obj(note) for note in notes_data]
    
    # Get customer preferences
    prefs_query = """
    SELECT 
        customer_id, preferences, updated_at 
    FROM 
        customer_preferences 
    WHERE 
        customer_id = $1
    """
    prefs_data = await fetch_one(prefs_query, [customer_id])
    preferences = CustomerPreferences.parse_obj(prefs_data) if prefs_data else None
    
    # Combine everything into a CustomerWithDetails object
    customer = CustomerWithDetails.parse_obj(customer_data)
    customer.notes = notes
    customer.preferences = preferences
    
    return customer


async def create_customer(customer: CustomerCreate) -> Customer:
    """
    Create a new customer.
    """
    # Check if email already exists
    check_query = "SELECT id FROM customers WHERE email = $1"
    existing = await fetch_one(check_query, [customer.email])
    
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    query = """
    INSERT INTO customers 
        (email, full_name, phone, address, postal_code, city, customer_type) 
    VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
        id, email, full_name, phone, address, postal_code, city, customer_type, 
        created_at, updated_at
    """
    
    params = [
        customer.email, 
        customer.full_name,
        customer.phone,
        customer.address,
        customer.postal_code,
        customer.city,
        customer.customer_type
    ]
    
    customer_data = await fetch_one(query, params)
    return Customer.parse_obj(customer_data)


async def update_customer(customer_id: UUID, customer_update: CustomerUpdate) -> Optional[Customer]:
    """
    Update an existing customer.
    """
    # Build dynamic update query
    update_fields = {}
    if customer_update.email is not None:
        update_fields["email"] = customer_update.email
    if customer_update.full_name is not None:
        update_fields["full_name"] = customer_update.full_name
    if customer_update.phone is not None:
        update_fields["phone"] = customer_update.phone
    if customer_update.address is not None:
        update_fields["address"] = customer_update.address
    if customer_update.postal_code is not None:
        update_fields["postal_code"] = customer_update.postal_code
    if customer_update.city is not None:
        update_fields["city"] = customer_update.city
    if customer_update.customer_type is not None:
        update_fields["customer_type"] = customer_update.customer_type
    
    if not update_fields:
        # No fields to update, return current customer
        return await get_customer_by_id(customer_id)
    
    # Generate dynamic update query
    query, params = generate_update_query(
        "customers",
        update_fields,
        {"id": customer_id},
        returning="id, email, full_name, phone, address, postal_code, city, customer_type, created_at, updated_at"
    )
    
    customer_data = await fetch_one(query, params)
    return Customer.parse_obj(customer_data) if customer_data else None


async def delete_customer(customer_id: UUID) -> bool:
    """
    Delete a customer.
    """
    query = "DELETE FROM customers WHERE id = $1 RETURNING id"
    result = await fetch_one(query, [customer_id])
    return result is not None


async def get_customer_orders(customer_id: UUID, skip: int = 0, limit: int = 50) -> List[Order]:
    """
    Get orders for a specific customer.
    """
    # Query depends on how orders are related to customers in your schema
    query = """
    SELECT 
        o.id, o.customer_id, o.order_number, o.status, o.total_amount, 
        o.created_at, o.updated_at
    FROM 
        orders o
    WHERE 
        o.customer_id = $1
    ORDER BY 
        o.created_at DESC
    LIMIT $2 OFFSET $3
    """
    
    orders_data = await fetch_all(query, [customer_id, limit, skip])
    return [Order.parse_obj(order) for order in orders_data]


async def get_customer_notes(customer_id: UUID) -> List[CustomerNote]:
    """
    Get all notes for a customer.
    """
    query = """
    SELECT 
        id, customer_id, content, created_by, created_at 
    FROM 
        customer_notes 
    WHERE 
        customer_id = $1
    ORDER BY 
        created_at DESC
    """
    
    notes_data = await fetch_all(query, [customer_id])
    return [CustomerNote.parse_obj(note) for note in notes_data]


async def add_customer_note(note: CustomerNoteCreate, created_by: UUID) -> CustomerNote:
    """
    Add a note to a customer.
    """
    query = """
    INSERT INTO customer_notes 
        (customer_id, content, created_by) 
    VALUES 
        ($1, $2, $3)
    RETURNING 
        id, customer_id, content, created_by, created_at
    """
    
    note_data = await fetch_one(query, [note.customer_id, note.content, created_by])
    return CustomerNote.parse_obj(note_data)


async def get_customer_preferences(customer_id: UUID) -> Optional[CustomerPreferences]:
    """
    Get preferences for a customer.
    """
    query = """
    SELECT 
        customer_id, preferences, updated_at 
    FROM 
        customer_preferences 
    WHERE 
        customer_id = $1
    """
    
    prefs_data = await fetch_one(query, [customer_id])
    return CustomerPreferences.parse_obj(prefs_data) if prefs_data else None


async def create_or_update_customer_preferences(preferences: CustomerPreferencesCreate) -> CustomerPreferences:
    """
    Create or update customer preferences.
    """
    query = """
    INSERT INTO customer_preferences 
        (customer_id, preferences) 
    VALUES 
        ($1, $2)
    ON CONFLICT (customer_id) 
    DO UPDATE SET 
        preferences = $2,
        updated_at = now()
    RETURNING 
        customer_id, preferences, updated_at
    """
    
    prefs_data = await fetch_one(query, [
        preferences.customer_id, 
        json.dumps(preferences.preferences)
    ])
    
    return CustomerPreferences.parse_obj(prefs_data) 