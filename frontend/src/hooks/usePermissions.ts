import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { 
  hasPermission, 
  hasAllPermissions, 
  hasAnyPermission, 
  hasMinimumRole 
} from '../utils/permissions';

/**
 * Hook for checking permissions in components
 */
const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;

  return {
    /**
     * Check if the current user has a specific permission
     */
    can: (permission: string): boolean => {
      return hasPermission(userRole, permission);
    },

    /**
     * Check if the current user has all of the specified permissions
     */
    canAll: (permissions: string[]): boolean => {
      return hasAllPermissions(userRole, permissions);
    },

    /**
     * Check if the current user has any of the specified permissions
     */
    canAny: (permissions: string[]): boolean => {
      return hasAnyPermission(userRole, permissions);
    },

    /**
     * Check if the current user has the specified role or higher
     */
    hasRole: (role: UserRole): boolean => {
      return hasMinimumRole(userRole, role);
    },

    /**
     * Get the current user's role
     */
    role: userRole
  };
};

export default usePermissions; 