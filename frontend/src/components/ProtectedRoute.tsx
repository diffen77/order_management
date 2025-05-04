import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type ProtectedRouteProps = {
  children?: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Redirect to login page and save the attempted URL
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If there are children, render them, otherwise render the outlet
  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute; 