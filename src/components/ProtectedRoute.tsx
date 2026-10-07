import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isProfileComplete } from '../types/profile';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowIncomplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowIncomplete = false,
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Verifying student session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user signed up via email/password and Supabase has not yet confirmed their email:
  // Note: OAuth providers (Google, GitHub) always have email_confirmed_at set by Supabase
  const isEmailUnconfirmed =
    user.app_metadata?.provider === 'email' && !user.email_confirmed_at;

  if (isEmailUnconfirmed) {
    return <Navigate to={`/auth/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />;
  }

  // If student profile is incomplete and route does not allow incomplete profile,
  // redirect them to /complete-profile
  if (!allowIncomplete && !isProfileComplete(profile) && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};
