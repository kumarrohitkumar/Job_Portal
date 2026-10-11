import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from './States';

/** Guests go to sign in (and come back after); the wrong role goes home. The API enforces this too. */
export function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'recruiter' ? '/recruiter/jobs' : '/jobs'} replace />;
  return children;
}
