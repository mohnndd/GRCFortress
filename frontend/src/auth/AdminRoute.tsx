import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loadCurrentUser } = useAuth();
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (!user) {
      loadCurrentUser().finally(() => setLoading(false));
    }
  }, [user, loadCurrentUser]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user?.roles.includes('ADMIN')) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
