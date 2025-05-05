"""
Products API endpoints module.
This module handles all API operations related to products.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Dict, Optional
from uuid import UUID
from app.middleware.auth import get_current_user, require_permission
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services import product_service

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: Dict = Depends(require_permission("read:products"))
):
    """
    Get a list of products with pagination support.
    Requires read:products permission.
    """
    filters = {}
    if category:
        filters["category"] = category
    
    try:
        products = await product_service.get_products(skip, limit, filters)
        return products
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving products: {str(e)}"
        )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID = Path(...),
    current_user: Dict = Depends(require_permission("read:products"))
):
    """
    Get a specific product by ID.
    Requires read:products permission.
    """
    try:
        product = await product_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving product: {str(e)}"
        )

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: Dict = Depends(require_permission("create:products"))
):
    """
    Create a new product.
    Requires create:products permission.
    """
    try:
        # Add producer_id from the current user
        product_dict = product_data.dict()
        product_dict["producer_id"] = current_user["id"]
        
        new_product = await product_service.create_product(product_dict)
        return new_product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating product: {str(e)}"
        )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID = Path(...),
    product_data: ProductUpdate = Body(...),
    current_user: Dict = Depends(require_permission("update:products"))
):
    """
    Update an existing product.
    Requires update:products permission.
    """
    try:
        # Check if product exists
        existing_product = await product_service.get_product_by_id(product_id)
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        
        # Only allow update if user is the producer or has admin rights
        if existing_product["producer_id"] != current_user["id"] and "admin" not in current_user.get("roles", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this product"
            )
        
        # Update product
        product_dict = product_data.dict(exclude_unset=True)
        updated_product = await product_service.update_product(product_id, product_dict)
        return updated_product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating product: {str(e)}"
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID = Path(...),
    current_user: Dict = Depends(require_permission("delete:products"))
):
    """
    Delete a product.
    Requires delete:products permission.
    """
    try:
        # Check if product exists
        existing_product = await product_service.get_product_by_id(product_id)
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        
        # Only allow deletion if user is the producer or has admin rights
        if existing_product["producer_id"] != current_user["id"] and "admin" not in current_user.get("roles", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this product"
            )
        
        # Delete product
        await product_service.delete_product(product_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting product: {str(e)}"
        )

@router.get("/inventory", response_model=List[Dict])
async def get_inventory(
    current_user: Dict = Depends(require_permission("read:inventory"))
):
    """
    Get current inventory levels for all products.
    Requires read:inventory permission.
    """
    try:
        inventory = await product_service.get_inventory()
        return inventory
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving inventory: {str(e)}"
        )

@router.post("/inventory/adjust", response_model=Dict)
async def adjust_inventory(
    product_id: UUID = Body(...),
    quantity: int = Body(...),
    current_user: Dict = Depends(require_permission("update:inventory"))
):
    """
    Adjust inventory for a specific product.
    Requires update:inventory permission.
    """
    try:
        updated_product = await product_service.adjust_inventory(product_id, quantity)
        return updated_product
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adjusting inventory: {str(e)}"
        )

# Category Management Endpoints
@router.get("/categories", response_model=List[str])
async def get_categories(
    current_user: Dict = Depends(require_permission("read:products"))
):
    """
    Get all product categories.
    Requires read:products permission.
    """
    try:
        categories = await product_service.get_categories()
        return categories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving categories: {str(e)}"
        )

@router.post("/categories", response_model=str, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: Dict = Body(..., example={"name": "Electronics"}),
    current_user: Dict = Depends(require_permission("create:products"))
):
    """
    Create a new product category.
    Requires create:products permission.
    """
    try:
        if "name" not in category_data or not category_data["name"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name is required"
            )
        
        category_name = await product_service.create_category(category_data["name"])
        return category_name
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating category: {str(e)}"
        )

@router.put("/categories/{category_name}", response_model=str)
async def update_category(
    category_name: str = Path(...),
    category_data: Dict = Body(..., example={"name": "New Category Name"}),
    current_user: Dict = Depends(require_permission("update:products"))
):
    """
    Update a product category.
    Requires update:products permission.
    """
    try:
        if "name" not in category_data or not category_data["name"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New category name is required"
            )
        
        updated_name = await product_service.update_category(category_name, category_data["name"])
        return updated_name
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating category: {str(e)}"
        )

@router.delete("/categories/{category_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_name: str = Path(...),
    current_user: Dict = Depends(require_permission("delete:products"))
):
    """
    Delete a product category.
    Requires delete:products permission.
    """
    try:
        await product_service.delete_category(category_name)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting category: {str(e)}"
        ) 