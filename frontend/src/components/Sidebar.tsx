import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  };

  return (
    <div className="hidden md:block w-64 bg-white shadow-md">
      <div className="h-full px-3 py-4">
        <div className="space-y-2">
          <Link 
            to="/" 
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/')}`}
          >
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link 
            to="/products" 
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/products')}`}
          >
            <span className="ml-3">Products</span>
          </Link>
          <Link 
            to="/orders" 
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/orders')}`}
          >
            <span className="ml-3">Orders</span>
          </Link>
          <Link 
            to="/forms" 
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/forms')}`}
          >
            <span className="ml-3">Forms</span>
          </Link>
          <Link 
            to="/statistics" 
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive('/statistics')}`}
          >
            <span className="ml-3">Statistics</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 