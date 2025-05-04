from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Order Management API",
    description="API for Order Management SaaS",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Order Management API",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/users")
async def get_users():
    # Mock data for demonstration
    return [
        {"id": 1, "name": "John Doe", "email": "john@example.com"},
        {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
    ]

@app.get("/products")
async def get_products():
    # Mock data for demonstration
    return [
        {"id": 1, "name": "Product 1", "price": 99.99, "stock": 25},
        {"id": 2, "name": "Product 2", "price": 149.99, "stock": 10}
    ] 