import { UserRole } from '../types/auth';

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  'admin': [
    'create:users',
    'read:users',
    'update:users',
    'delete:users',
    'create:orders',
    'read:orders',
    'update:orders',
    'delete:orders',
    'create:products',
    'read:products',
    'update:products',
    'delete:products',
    'read:statistics',
    'manage:forms',
    'manage:settings'
  ],
  'producer': [
    'create:products',
    'read:products',
    'update:products',
    'delete:products',
    'read:orders',
    'update:orders',
    'read:statistics',
    'manage:forms',
    'manage:settings'
  ],
  'staff': [
    'read:products',
    'read:orders',
    'update:orders'
  ]
};

// Role hierarchy (higher number = higher access)
export const ROLE_HIERARCHY = {
  'admin': 3,
  'producer': 2,
  'staff': 1
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole | undefined, permission: string): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: UserRole | undefined, permissions: string[]): boolean => {
  if (!role) return false;
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: UserRole | undefined, permissions: string[]): boolean => {
  if (!role) return false;
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has sufficient hierarchy level
 */
export const hasMinimumRole = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}; 