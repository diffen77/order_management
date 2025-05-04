import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import ProtectedRoute from './ProtectedRoute';

type RoleBasedRouteProps = {
  children?: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
};

/**
 * A route that only allows access to users with specific roles
 * Extends ProtectedRoute to also check user authentication
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/unauthorized' 
}: RoleBasedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  // First render the ProtectedRoute to handle authentication
  return (
    <ProtectedRoute>
      {user && user.role && !allowedRoles.includes(user.role as UserRole) ? (
        // If user doesn't have the required role, redirect to fallback
        <Navigate to={fallbackPath} state={{ from: location }} replace />
      ) : (
        // If user has the required role, render children
        children
      )}
    </ProtectedRoute>
  );
};

export default RoleBasedRoute; 