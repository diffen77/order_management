# Order Management System

A comprehensive SaaS solution for managing orders, inventory, customers, and payments.

## Features

### For Producers
- Create customized order forms
- Manage products and inventory
- Process orders and track status
- Generate pick lists
- View statistics and trends

### For Administrators
- Full access to all producer features
- Manage users and permissions
- Handle subscription plans
- Create discount codes

## Technical Stack

- **Frontend**: React with TypeScript, Vite, and Tailwind CSS
- **Backend**: Python with FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Deployment**: Docker, GitHub Actions

## Project Structure

```
order-management/
├── frontend/              # React frontend application
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   ├── context/       # React context providers
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── ...                # Configuration files
├── backend/               # Python FastAPI backend
│   ├── app/               # Application code
│   │   ├── api/           # API routes
│   │   ├── core/          # Core functionality
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── tests/             # Test files
│   └── ...                # Configuration files
├── docs/                  # Documentation
├── e2e/                   # End-to-end tests
├── .github/               # GitHub Actions workflows
└── docker-compose.yml     # Docker configuration
```

## Development Environment

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git
- Docker and Docker Compose (optional)

### Installation

#### Option 1: Manual Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/diffen77/order_management.git
   cd order_management
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Unix/MacOS: source venv/bin/activate
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Copy `frontend/env.example` to `frontend/.env`
   - Copy `backend/env.example` to `backend/.env`
   - Update with your Supabase credentials

#### Option 2: Docker Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/diffen77/order_management.git
   cd order_management
   ```

2. Create a `.env` file in the project root with the required environment variables (see docs/docker-setup.md)

3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

### Development Workflow

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
   This will start the Vite development server at http://localhost:5173

2. Start the backend development server:
   ```bash
   cd backend
   # Activate virtual environment if not using Docker
   uvicorn app.main:app --reload
   ```
   This will start the FastAPI server at http://localhost:8000

3. Access the API documentation:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Testing

### Frontend Tests
```bash
cd frontend
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
```

### Backend Tests
```bash
cd backend
# Activate virtual environment if not using Docker
pytest             # Run all tests
pytest app/tests/test_api.py  # Run specific test file
```

### End-to-End Tests
```bash
cd e2e
npm test
```

## API Documentation

The API follows RESTful conventions and is organized into the following resource groups:

- **Authentication**: `/api/auth/*` - User registration, login, and token management
- **Users**: `/api/users/*` - User management and permissions
- **Orders**: `/api/orders/*` - Order creation, processing, and status updates
- **Products**: `/api/products/*` - Product catalog management
- **Inventory**: `/api/inventory/*` - Inventory tracking and adjustments
- **Customers**: `/api/customers/*` - Customer information management
- **Payments**: `/api/payments/*` - Payment processing and tracking
- **Reports**: `/api/reports/*` - Analytics and reporting

For detailed API documentation, see the Swagger UI at http://localhost:8000/docs when running the backend server.

## Deployment

### Production Deployment

The project includes GitHub Actions workflows for CI/CD pipeline:

1. On push to main branch, tests are run and Docker images are built
2. On release creation, Docker images are deployed to the production environment

See `.github/workflows/` for the detailed configuration.

For manual deployment, see [docs/docker-setup.md](docs/docker-setup.md).

## Contributing

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to the project.

## License

This project is proprietary software. All rights reserved. 