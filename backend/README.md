# Order Management Backend

This is the backend API for the Order Management system, built with FastAPI and integrated with Supabase.

## Features

- RESTful API endpoints for orders, products, users, and customers
- JWT authentication and authorization
- Supabase integration for data storage
- Email notifications
- Input validation and error handling

## Tech Stack

- **Python 3.10+**
- **FastAPI**: Modern, fast web framework for building APIs
- **Supabase**: Postgres database with authentication and real-time capabilities
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server
- **JWT**: For secure authentication

## Project Structure

```
backend/
├── app/                    # Main application package
│   ├── main.py             # FastAPI application entry point
│   ├── middleware/         # Custom middleware components
│   ├── models/             # Database models
│   ├── routes/             # API routes/endpoints
│   ├── schemas/            # Pydantic models for request/response validation
│   ├── services/           # Business logic and external service integration
│   └── utils/              # Utility functions and helpers
├── tests/                  # Test directory
├── .env.example            # Example environment variables
└── requirements.txt        # Python dependencies
```

## Getting Started

### Prerequisites

- Python 3.10+
- Supabase account
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd order-management/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your own values
   ```

### Running the Application

Start the development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000)

API documentation is available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## API Endpoints

The API includes the following main endpoint groups:

- `/api/auth`: Authentication endpoints
- `/api/users`: User management
- `/api/orders`: Order processing
- `/api/products`: Product management
- `/api/customers`: Customer management
- `/api/forms`: Custom order forms

## Testing

Run tests using pytest:

```bash
pytest
```

## Development Guidelines

- Follow PEP 8 style guidelines
- Write docstrings for all functions, classes, and modules
- Add unit tests for new functionality
- Use type hints for better code readability and IDE support 