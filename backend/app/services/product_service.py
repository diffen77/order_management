"""
Product service module for handling product-related database operations.
"""
from typing import Dict, Any, List, Optional, Union
from uuid import UUID
from decimal import Decimal
from datetime import datetime
import logging
from app.utils.db import get_supabase_client
from app.utils.logging import setup_logger
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

logger = setup_logger(__name__)

async def get_products(skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Get a list of products with pagination and optional filtering.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        filters: Optional dictionary of filter conditions
        
    Returns:
        List of product records
    """
    supabase = get_supabase_client()
    query = supabase.table("products").select("*")
    
    # Apply filters if provided
    if filters:
        for key, value in filters.items():
            query = query.eq(key, value)
    
    # Apply pagination
    query = query.range(skip, skip + limit - 1)
    
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise

async def get_product_by_id(product_id: Union[str, UUID]) -> Optional[Dict[str, Any]]:
    """
    Get a product by its ID.
    
    Args:
        product_id: The product ID to retrieve
        
    Returns:
        Product record or None if not found
    """
    supabase = get_supabase_client()
    try:
        response = supabase.table("products").select("*").eq("id", str(product_id)).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {str(e)}")
        raise

async def create_product(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new product.
    
    Args:
        product_data: Product data to insert
        
    Returns:
        Created product record
    """
    supabase = get_supabase_client()
    try:
        # Add timestamps
        now = datetime.utcnow().isoformat()
        product_data.update({
            "created_at": now,
            "updated_at": now
        })
        
        response = supabase.table("products").insert(product_data).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise

async def update_product(product_id: Union[str, UUID], product_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update an existing product.
    
    Args:
        product_id: ID of the product to update
        product_data: Updated product data
        
    Returns:
        Updated product record or None if not found
    """
    supabase = get_supabase_client()
    try:
        # Add updated timestamp
        product_data.update({
            "updated_at": datetime.utcnow().isoformat()
        })
        
        response = supabase.table("products").update(product_data).eq("id", str(product_id)).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}")
        raise

async def delete_product(product_id: Union[str, UUID]) -> bool:
    """
    Delete a product by its ID.
    
    Args:
        product_id: ID of the product to delete
        
    Returns:
        True if the product was deleted, False otherwise
    """
    supabase = get_supabase_client()
    try:
        response = supabase.table("products").delete().eq("id", str(product_id)).execute()
        return len(response.data) > 0
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}")
        raise

async def get_inventory() -> List[Dict[str, Any]]:
    """
    Get current inventory levels for all products.
    
    Returns:
        List of products with their inventory information
    """
    supabase = get_supabase_client()
    try:
        response = supabase.table("products").select("id, name, stock_quantity, unit").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching inventory: {str(e)}")
        raise

async def adjust_inventory(product_id: Union[str, UUID], quantity: int) -> Dict[str, Any]:
    """
    Adjust inventory for a specific product. Increments or decrements the stock quantity.
    
    Args:
        product_id: ID of the product to adjust
        quantity: Quantity to adjust (positive to add, negative to remove)
        
    Returns:
        Updated product record with new inventory level
    """
    supabase = get_supabase_client()
    try:
        # First get the current product to check the current stock
        product = await get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product with ID {product_id} not found")
        
        current_stock = product.get("stock_quantity", 0)
        new_stock = current_stock + quantity
        
        # Ensure stock doesn't go negative
        if new_stock < 0:
            raise ValueError(f"Cannot reduce inventory below zero. Current stock: {current_stock}, Adjustment: {quantity}")
        
        # Update the product with new stock quantity
        update_data = {
            "stock_quantity": new_stock,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Also create an inventory transaction record if we have that table
        try:
            transaction_data = {
                "product_id": str(product_id),
                "quantity_changed": quantity,
                "new_quantity": new_stock,
                "transaction_type": "adjustment",
                "created_at": datetime.utcnow().isoformat()
            }
            supabase.table("inventory_transactions").insert(transaction_data).execute()
        except Exception as e:
            # Just log this but don't fail the transaction if this table doesn't exist
            logger.warning(f"Could not record inventory transaction: {str(e)}")
        
        response = supabase.table("products").update(update_data).eq("id", str(product_id)).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Error adjusting inventory for product {product_id}: {str(e)}")
        raise

# Category Management Methods
async def get_categories() -> List[str]:
    """
    Get all product categories.
    
    Returns:
        List of category names
    """
    supabase = get_supabase_client()
    try:
        # Try to get categories from the categories table if it exists
        try:
            response = supabase.table("product_categories").select("name").execute()
            return [category["name"] for category in response.data]
        except Exception:
            # If categories table doesn't exist, get distinct categories from products
            logger.info("No product_categories table found, getting distinct categories from products")
            response = supabase.table("products").select("category").execute()
            categories = set()
            for product in response.data:
                if product.get("category") and product["category"].strip():
                    categories.add(product["category"])
            return sorted(list(categories))
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise

async def create_category(name: str) -> str:
    """
    Create a new product category.
    
    Args:
        name: The name of the category to create
        
    Returns:
        The created category name
    """
    supabase = get_supabase_client()
    try:
        # Try to insert into the categories table if it exists
        try:
            category_data = {
                "name": name,
                "created_at": datetime.utcnow().isoformat()
            }
            response = supabase.table("product_categories").insert(category_data).execute()
            return response.data[0]["name"] if response.data else name
        except Exception:
            # If categories table doesn't exist, just return the name
            # (will be stored in products table when products are created/updated)
            logger.info("No product_categories table found, category will be stored with products")
            return name
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        raise

async def update_category(old_name: str, new_name: str) -> str:
    """
    Update a product category name.
    
    Args:
        old_name: The current name of the category
        new_name: The new name for the category
        
    Returns:
        The updated category name
    """
    supabase = get_supabase_client()
    try:
        # Try to update the categories table if it exists
        try:
            # Check if category exists
            categories = await get_categories()
            if old_name not in categories:
                raise ValueError(f"Category '{old_name}' not found")
            
            # Update in the categories table
            update_data = {
                "name": new_name,
                "updated_at": datetime.utcnow().isoformat()
            }
            response = supabase.table("product_categories").update(update_data).eq("name", old_name).execute()
            
            # Also update all products with this category
            product_update = {
                "category": new_name,
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("products").update(product_update).eq("category", old_name).execute()
            
            return new_name
        except ValueError:
            # Re-raise ValueError for not found
            raise
        except Exception:
            # If categories table doesn't exist, just update in products table
            logger.info("No product_categories table found, updating category in products table only")
            # Check if category exists in products
            categories = await get_categories()
            if old_name not in categories:
                raise ValueError(f"Category '{old_name}' not found")
            
            # Update all products with this category
            product_update = {
                "category": new_name,
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("products").update(product_update).eq("category", old_name).execute()
            
            return new_name
    except Exception as e:
        logger.error(f"Error updating category from '{old_name}' to '{new_name}': {str(e)}")
        raise

async def delete_category(name: str) -> None:
    """
    Delete a product category.
    
    Args:
        name: The name of the category to delete
        
    Returns:
        None
    """
    supabase = get_supabase_client()
    try:
        # Check if category exists
        categories = await get_categories()
        if name not in categories:
            raise ValueError(f"Category '{name}' not found")
        
        # Try to delete from the categories table if it exists
        try:
            # Delete from categories table
            supabase.table("product_categories").delete().eq("name", name).execute()
            
            # Update all products with this category to have null category
            product_update = {
                "category": None,
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("products").update(product_update).eq("category", name).execute()
        except Exception:
            # If categories table doesn't exist, just update products
            logger.info("No product_categories table found, removing category from products only")
            # Update all products with this category to have null category
            product_update = {
                "category": None,
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("products").update(product_update).eq("category", name).execute()
    except ValueError:
        # Re-raise ValueError for not found
        raise
    except Exception as e:
        logger.error(f"Error deleting category '{name}': {str(e)}")
        raise 