import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BlockedVault from './BlockedVault';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBlocked, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show blocked vault screen if account is blocked
  if (isBlocked) {
    return <BlockedVault />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
