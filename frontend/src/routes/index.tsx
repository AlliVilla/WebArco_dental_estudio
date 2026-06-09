import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/hooks/useAuthStore";

interface GuardProps {
  children: React.ReactNode;
}

const Spinner = () => (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: "3px solid var(--border-color)",
        borderTopColor: "var(--primary)",
        borderRadius: "50%",
        animation: "spinSlow 1s linear infinite",
      }}
    />
  </div>
);

/** Solo entra si está autenticado, si no → /login */
export const AuthGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/** Solo entra si NO está autenticado, si ya lo está → /dashboard */
export const GuestGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

export default AuthGuard;
