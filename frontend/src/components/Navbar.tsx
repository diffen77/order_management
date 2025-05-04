import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-blue-700 text-white' 
      : 'text-gray-300 hover:bg-blue-600 hover:text-white';
  };

  const handleSignOut = () => {
    // We'll implement this properly later
    navigate('/auth/login');
  };

  return (
    <nav className="bg-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold">Order Management</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/products"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/products')}`}
                >
                  Products
                </Link>
                <Link
                  to="/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/orders')}`}
                >
                  Orders
                </Link>
                <Link
                  to="/forms"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/forms')}`}
                >
                  Forms
                </Link>
                <Link
                  to="/statistics"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/statistics')}`}
                >
                  Statistics
                </Link>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-blue-600 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}
          >
            Dashboard
          </Link>
          <Link
            to="/products"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/products')}`}
          >
            Products
          </Link>
          <Link
            to="/orders"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/orders')}`}
          >
            Orders
          </Link>
          <Link
            to="/forms"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/forms')}`}
          >
            Forms
          </Link>
          <Link
            to="/statistics"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/statistics')}`}
          >
            Statistics
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 