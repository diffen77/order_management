from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.middleware.error_handler import setup_error_handler
from app.utils.logging import setup_logger
from app.utils.config import settings

# Set up logger
logger = setup_logger(__name__)

app = FastAPI(
    title="Order Management API",
    description="API for Order Management SaaS",
    version="0.1.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:5174",
    "http://localhost:5175",
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],  # Filter out empty strings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup error handling
setup_error_handler(app)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Order Management API",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }

# Import and include routers
# from app.routes import users, auth, orders, products
# 
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
# app.include_router(products.router, prefix="/api/products", tags=["Products"])

logger.info(f"Application startup complete in {settings.ENVIRONMENT} environment")

if __name__ == "__main__":
    import uvicorn
    port = settings.API_PORT
    logger.info(f"Starting server on port {port}")
    uvicorn.run("app.main:app", host=settings.API_HOST, port=port, reload=True) 