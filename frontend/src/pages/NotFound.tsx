import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="mb-6 text-gray-600">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 