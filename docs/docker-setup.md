# Docker Setup Guide

This document provides instructions for setting up and running the Order Management application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned locally

## Environment Configuration

Before running the application with Docker, you need to create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_KEY=your_supabase_service_key

# Database Configuration
DATABASE_URL=your_database_url

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Other Configuration
NODE_ENV=development
ENVIRONMENT=development
```

Replace the placeholder values with your actual configuration details.

## Building and Running the Application

To build and start the application:

```bash
docker-compose up --build
```

This will:
- Build the frontend and backend Docker images
- Start the containers
- Mount the local directories as volumes for development
- Forward the necessary ports

To run in detached mode:

```bash
docker-compose up -d
```

## Accessing the Application

Once the containers are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Workflow

The Docker configuration is set up with volume mounts to support live development:

- Changes to frontend code will trigger a rebuild by Vite
- Changes to backend code will be reflected upon saving
- The containers are configured to restart automatically unless stopped manually

## Stopping the Application

To stop the running containers:

```bash
docker-compose down
```

To stop and remove volumes:

```bash
docker-compose down -v
```

## Troubleshooting

If you encounter issues:

1. Check container logs:
   ```bash
   docker-compose logs frontend
   docker-compose logs backend
   ```

2. Rebuild containers:
   ```bash
   docker-compose up --build
   ```

3. Check if ports 3000 and 8000 are available on your system

## Production Deployment

For production deployment:

1. Create a `.env.production` file with production configuration
2. Run using:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

**Note**: A production `docker-compose.prod.yml` file would need to be created with production-specific configurations. 