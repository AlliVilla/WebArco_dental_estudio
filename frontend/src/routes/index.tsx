import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "../components";
import { useAuthStore } from "../features/auth/hooks/useAuthStore";

export interface GuardProps {
  children: React.ReactNode;
}

function CenteredSpinner() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner size={40} />
    </div>
  );
}

/** Solo entra si está autenticado, si no → /login */
export function AuthGuard({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <CenteredSpinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Solo entra si NO está autenticado, si ya lo está → /dashboard */
export function GuestGuard({ children }: GuardProps) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

interface PrivilegeGuardProps extends GuardProps {
  privileges: number[];
}

/** Verifica que el usuario tenga al menos uno de los privilegios requeridos */
export function PrivilegeGuard({ children, privileges }: PrivilegeGuardProps) {
  const user = useAuthStore((s) => s.user);
  const hasPrivilege = useMemo(
    () => privileges.some((p) => user?.privilegios?.includes(p)),
    [privileges, user?.privilegios],
  );

  if (!hasPrivilege) {
    return (
      <Navigate
        to="/dashboard"
        state={{ noPermission: true, section: "esta sección" }}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
