"""
API Router organization module.
This module centralizes all route imports and provides a structured way
to include them in the main FastAPI application.
"""
from fastapi import APIRouter
from .users import router as users_router
from .auth import router as auth_router
from .products import router as products_router
from .customers import router as customers_router
from .orders import router as orders_router
from .email import router as email_router
from .api_info import router as info_router
from .fulfillment import router as fulfillment_router
from app.utils.config import settings

# Create API version router
api_router_v1 = APIRouter()

# Include all resource routers with appropriate prefixes and tags
api_router_v1.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router_v1.include_router(users_router, prefix="/users", tags=["users"])
api_router_v1.include_router(products_router, prefix="/products", tags=["products"])
api_router_v1.include_router(customers_router, prefix="/customers", tags=["customers"])
api_router_v1.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router_v1.include_router(email_router, prefix="/email", tags=["email"])
api_router_v1.include_router(fulfillment_router, prefix="/fulfillment", tags=["fulfillment"])
api_router_v1.include_router(info_router, tags=["info"])

# Function to setup all routes for the main application
def setup_routes(app):
    """
    Setup all routes for the main application.
    
    Args:
        app: FastAPI application instance
    """
    # Include the main API router with version prefix
    app.include_router(api_router_v1, prefix=f"/api/{settings.API_VERSION}")
    
    # Add basic API root level info endpoint
    @app.get("/api")
    async def api_root():
        """Get API version information."""
        return {
            "versions": [settings.API_VERSION],
            "current_version": settings.API_VERSION,
            "documentation": "/docs"
        } 