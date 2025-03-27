import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'teacher';
}

function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to the appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin" />;
    } else if (userRole === 'teacher') {
      return <Navigate to="/teacher" />;
    } else {
      // If unknown role, logout by redirecting to login
      return <Navigate to="/login" />;
    }
  }

  return <>{children}</>;
}

export default PrivateRoute; 