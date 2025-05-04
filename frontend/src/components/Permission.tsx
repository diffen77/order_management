import React from 'react';
import usePermissions from '../hooks/usePermissions';
import { UserRole } from '../types/auth';

interface PermissionProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: UserRole;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on user permissions
 */
const Permission: React.FC<PermissionProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  fallback = null
}) => {
  const { can, canAll, canAny, hasRole } = usePermissions();
  
  // No permissions or roles specified, just render children
  if (!permission && permissions.length === 0 && !role) {
    return <>{children}</>;
  }

  let hasPermission = true;

  // Check for single permission
  if (permission) {
    hasPermission = hasPermission && can(permission);
  }

  // Check for multiple permissions
  if (permissions.length > 0) {
    hasPermission = hasPermission && (requireAll ? canAll(permissions) : canAny(permissions));
  }

  // Check for role
  if (role) {
    hasPermission = hasPermission && hasRole(role);
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default Permission; 