# API Documentation

This document provides detailed information about the Order Management System API endpoints, request/response formats, and examples.

## Base URL

All API endpoints are relative to the base URL:

- Development: `http://localhost:8000/api`
- Production: `https://api.example.com/api` (replace with actual production URL)

## Authentication

Most API endpoints require authentication using JWT tokens.

### Headers

Include the following headers in your requests:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Endpoints

#### Register User

```
POST /auth/register
```

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "staff"
}
```

Response:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "staff",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### Login

```
POST /auth/login
```

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "staff"
  }
}
```

## Orders API

### Get All Orders

```
GET /orders
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (optional)
- `customer_id`: Filter by customer (optional)
- `from_date`: Filter by date range start (optional)
- `to_date`: Filter by date range end (optional)

Response:
```json
{
  "items": [
    {
      "id": "order_id",
      "customer": {
        "id": "customer_id",
        "name": "Customer Name"
      },
      "status": "pending",
      "total_amount": 150.00,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

### Get Order Details

```
GET /orders/{id}
```

Response:
```json
{
  "id": "order_id",
  "customer": {
    "id": "customer_id",
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "1234567890"
  },
  "status": "pending",
  "total_amount": 150.00,
  "items": [
    {
      "id": "item_id",
      "product": {
        "id": "product_id",
        "name": "Product Name",
        "sku": "PROD001"
      },
      "quantity": 2,
      "price": 75.00,
      "total": 150.00
    }
  ],
  "payment_status": "pending",
  "notes": "Special delivery instructions",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Create Order

```
POST /orders
```

Request:
```json
{
  "customer_id": "customer_id",
  "items": [
    {
      "product_id": "product_id",
      "quantity": 2
    }
  ],
  "notes": "Special delivery instructions"
}
```

Response:
```json
{
  "id": "order_id",
  "customer": {
    "id": "customer_id",
    "name": "Customer Name"
  },
  "status": "pending",
  "total_amount": 150.00,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Update Order

```
PUT /orders/{id}
```

Request:
```json
{
  "status": "processing",
  "items": [
    {
      "product_id": "product_id",
      "quantity": 3
    }
  ],
  "notes": "Updated special delivery instructions"
}
```

Response:
```json
{
  "id": "order_id",
  "status": "processing",
  "total_amount": 225.00,
  "updated_at": "2023-01-02T00:00:00Z"
}
```

### Delete Order

```
DELETE /orders/{id}
```

Response:
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

## Products API

### Get All Products

```
GET /products
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category (optional)
- `search`: Search term (optional)

Response:
```json
{
  "items": [
    {
      "id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "sku": "PROD001",
      "price": 75.00,
      "quantity": 100,
      "category": "Category Name",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

### Get Product Details

```
GET /products/{id}
```

Response:
```json
{
  "id": "product_id",
  "name": "Product Name",
  "description": "Product description",
  "sku": "PROD001",
  "price": 75.00,
  "cost": 50.00,
  "quantity": 100,
  "reorder_level": 20,
  "category": "Category Name",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

## Customers API

### Get All Customers

```
GET /customers
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term (optional)

Response:
```json
{
  "items": [
    {
      "id": "customer_id",
      "name": "Customer Name",
      "email": "customer@example.com",
      "phone": "1234567890",
      "type": "regular",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

## Reports API

### Get Sales Report

```
GET /reports/sales
```

Query Parameters:
- `from_date`: Start date (required)
- `to_date`: End date (required)
- `interval`: Grouping interval (day, week, month, year, default: month)

Response:
```json
{
  "total_sales": 15000.00,
  "order_count": 200,
  "average_order_value": 75.00,
  "data": [
    {
      "period": "2023-01",
      "sales": 5000.00,
      "orders": 67
    },
    {
      "period": "2023-02",
      "sales": 5500.00,
      "orders": 73
    },
    {
      "period": "2023-03",
      "sales": 4500.00,
      "orders": 60
    }
  ]
}
```

## Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": ["Specific error for this field"]
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Authentication is required
- `INVALID_CREDENTIALS`: Invalid login credentials
- `PERMISSION_DENIED`: User doesn't have permission for this operation
- `RESOURCE_NOT_FOUND`: The requested resource was not found
- `VALIDATION_ERROR`: Request data failed validation
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API requests are rate limited to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When a rate limit is exceeded, the API will respond with a 429 status code and the following headers:

- `X-RateLimit-Limit`: The number of requests allowed per time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets 