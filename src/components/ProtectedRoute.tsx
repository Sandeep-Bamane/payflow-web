import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export function ProtectedRoute() {
  const { userId } = useAuth();

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // renders whichever child route matched
}
