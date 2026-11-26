import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BlockedVault from './BlockedVault';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBlocked, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
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
