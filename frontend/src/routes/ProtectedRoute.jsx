import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common/Feedback';

export function ProtectedRoute({ roles }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();
  if (initializing) return <LoadingState label="Checking session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <LoadingState label="Checking session…" />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
