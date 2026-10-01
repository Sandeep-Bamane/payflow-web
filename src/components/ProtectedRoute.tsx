import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useSocket } from '../hooks/useSocket';
import { Navbar } from './Navbar';

export function ProtectedRoute() {
  const { userId } = useAuth();
  // Before the early return (hooks can't be conditional); it connects only while userId is set
  useSocket();

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // Navbar sits above each page's PageContainer, so every signed-in screen gets it
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
