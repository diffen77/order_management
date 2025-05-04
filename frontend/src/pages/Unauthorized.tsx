import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
        <div className="text-6xl font-bold text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H9a3 3 0 00-3 3v4m12-4v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p className="mb-6 text-gray-600">
          You don't have permission to access this page. This area requires additional privileges.
        </p>
        <p className="mb-6 text-sm text-gray-500">
          {user ? `Current role: ${user.role}` : 'Not logged in'}
        </p>
        <div className="flex flex-col space-y-2">
          <Link 
            to="/" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Go to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 