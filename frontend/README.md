# Order Management Frontend

Frontend application for the Order Management system, built with React, TypeScript, and Tailwind CSS.

## Features

- User authentication and role-based access control
- Product management
- Order processing
- Custom order form builder
- Customer management
- Statistics and reporting
- Responsive design for desktop and mobile

## Tech Stack

- **React 18**: Modern UI library
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **React Router**: Routing and navigation
- **Supabase JS Client**: Database and authentication integration
- **Axios**: HTTP client for API requests

## Project Structure

```
frontend/
├── public/              # Static files
├── src/                 # Source code
│   ├── assets/          # Images, icons, and other static assets
│   ├── components/      # Reusable UI components
│   ├── constants/       # Application constants
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── .env.example         # Example environment variables
├── index.html           # HTML template
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd order-management/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:5173](http://localhost:5173)

### Building for Production

Build the application for production:

```bash
npm run build
# or
yarn build
```

Preview the production build:

```bash
npm run preview
# or
yarn preview
```

## Development Guidelines

### Component Structure

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Implement proper error handling
- Document complex components with JSDoc comments

### State Management

- Use React Context for global state
- Use local state (useState) for component-specific state
- Extract complex logic into custom hooks
- Use reducers (useReducer) for complex state logic

### API Communication

- Use service modules for API calls
- Implement proper error handling
- Use TypeScript types for request/response data
- Handle loading states and error states

### Styling

- Use Tailwind CSS for styling
- Follow the design system for consistency
- Use responsive design principles
- Implement dark mode support

### Testing

Run tests:

```bash
npm run test
# or
yarn test
```

### Code Style

- Follow ESLint and Prettier configurations
- Use consistent naming conventions
- Document complex functions with JSDoc comments
- Use proper error handling and logging

## Folder Structure Details

### Components

The `components` directory contains reusable UI components, organized by feature or type:

- `Layout`: Layout components like Sidebar, Navbar
- `UI`: Basic UI components like Button, Input, Modal
- `Forms`: Form-related components
- `Tables`: Table-related components
- `Common`: Shared components used across features

### Pages

The `pages` directory contains the main page components, organized by feature:

- `auth`: Authentication pages (Login, Register)
- `dashboard`: Dashboard page
- `products`: Product management pages
- `orders`: Order management pages
- `customers`: Customer management pages
- `forms`: Form builder pages
- `statistics`: Statistics and reporting pages

### Services

The `services` directory contains API service modules:

- `api.ts`: Base API client
- `auth-service.ts`: Authentication service
- `product-service.ts`: Product API service
- `order-service.ts`: Order API service
- `customer-service.ts`: Customer API service
- `form-service.ts`: Form API service

### Types

The `types` directory contains TypeScript type definitions:

- `api.ts`: API-related types
- `auth.ts`: Authentication types
- `models.ts`: Business model types
- `ui.ts`: UI component types

### Utils

The `utils` directory contains utility functions:

- `format.ts`: Formatting utilities
- `validation.ts`: Validation utilities
- `storage.ts`: Local storage utilities
- `date.ts`: Date manipulation utilities 