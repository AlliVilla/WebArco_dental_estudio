import React from 'react';
import { useAuthStore } from '../features/auth/hooks/useAuthStore';

interface GuardProps {
  children: React.ReactNode;
  fallbackRedirect?: string;
}

/**
 * AuthGuard: Renders children if authenticated, otherwise redirects or hides.
 */
export const AuthGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spinSlow 1s linear infinite'
        }} />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

/**
 * GuestGuard: Renders children if NOT authenticated (e.g. login form).
 */
export const GuestGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  return !isAuthenticated ? <>{children}</> : null;
};
export default AuthGuard;
