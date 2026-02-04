import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, authLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Save the attempted URL for redirecting after login
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
