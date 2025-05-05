import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import Permission from './Permission';

interface NavItem {
  path: string;
  label: string;
  permission?: string;
  permissions?: string[];
  role?: 'admin' | 'producer' | 'staff';
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { role } = usePermissions();

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  };

  // Define navigation items with required permissions
  const navigationItems: NavItem[] = [
    { path: '/', label: 'Dashboard' },
    { path: '/orders', label: 'Orders', permission: 'read:orders' },
    { path: '/customers', label: 'Customers', permission: 'read:customers' },
    { path: '/products', label: 'Products', permission: 'read:products' },
    { path: '/forms', label: 'Forms', permission: 'manage:forms' },
    { path: '/statistics', label: 'Statistics', permission: 'read:statistics' }
  ];

  // Admin-specific navigation items
  const adminItems: NavItem[] = [
    { path: '/admin/users', label: 'User Management', role: 'admin' },
    { path: '/admin/settings', label: 'System Settings', role: 'admin' }
  ];

  return (
    <div className="hidden md:block w-64 bg-white shadow-md">
      <div className="h-full px-3 py-4">
        <div className="space-y-2">
          {/* Main navigation items */}
          {navigationItems.map((item) => (
            <Permission 
              key={item.path}
              permission={item.permission}
              permissions={item.permissions}
              role={item.role}
            >
              <Link 
                to={item.path} 
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive(item.path)}`}
              >
                <span className="ml-3">{item.label}</span>
              </Link>
            </Permission>
          ))}

          {/* Admin section */}
          {role === 'admin' && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </h3>
              </div>
              
              {adminItems.map((item) => (
                <Permission 
                  key={item.path}
                  role={item.role}
                >
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive(item.path)}`}
                  >
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </Permission>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 