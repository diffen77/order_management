from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.middleware.error_handler import setup_error_handler
from app.middleware.request_logger import setup_request_logger
from app.middleware.rate_limiter import setup_rate_limiter
from app.utils.logging import setup_logger
from app.utils.config import settings
from app.routes import setup_routes

# Set up logger
logger = setup_logger(__name__)

app = FastAPI(
    title="Order Management API",
    description="API for Order Management SaaS",
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup middleware in the correct order (important!)
# 1. Request logger should be first to capture all requests
setup_request_logger(app)

# 2. Rate limiter middleware
setup_rate_limiter(
    app,
    rate_limit=settings.RATE_LIMIT_MAX_REQUESTS,
    time_window=settings.RATE_LIMIT_WINDOW_SECONDS,
    exempt_paths=["/health", "/docs", "/openapi.json", "/redoc"]
)

# 3. CORS middleware
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

# 4. Error handling middleware should be last to catch all exceptions
setup_error_handler(app)

# Root endpoint redirects to docs
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Order Management API",
        "docs": "/docs",
        "api": "/api"
    }

# Setup routes using the centralized router organization
setup_routes(app)

logger.info(f"Application startup complete in {settings.ENVIRONMENT} environment")

if __name__ == "__main__":
    import uvicorn
    port = settings.API_PORT
    logger.info(f"Starting server on port {port}")
    uvicorn.run("app.main:app", host=settings.API_HOST, port=port, reload=True) 