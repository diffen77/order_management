"""
API Router organization module.
This module centralizes all route imports and provides a structured way
to include them in the main FastAPI application.
"""
from fastapi import APIRouter
from app.routes import users, auth, api_info, orders, products
from app.utils.config import settings

# Create API version router
api_router_v1 = APIRouter()

# Include all resource routers with appropriate prefixes and tags
api_router_v1.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router_v1.include_router(users.router, prefix="/users", tags=["Users"])
api_router_v1.include_router(api_info.router, prefix="/info", tags=["API Information"])

# Comment out these until they are fully implemented
# api_router_v1.include_router(orders.router, prefix="/orders", tags=["Orders"])
# api_router_v1.include_router(products.router, prefix="/products", tags=["Products"])

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