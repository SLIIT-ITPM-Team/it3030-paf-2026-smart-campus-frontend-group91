import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
  const { hasRoles, isInitializing } = useAuth();

  if (isInitializing) {
    return <div className="status-card">Checking role access...</div>;
  }

  if (!hasRoles(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

