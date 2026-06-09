import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, PasswordInput, Alert } from "../../../context";
import { useAuthStore } from "../hooks/useAuthStore";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import heroBg from "../../../assets/hero.png";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const { login, error, isLoading, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [hoverForgot, setHoverForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login(username, password);
      onSuccess?.();
      navigate("/dashboard");
    } catch {
      /* error manejado en store */
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {showForgot ? (
          <ForgotPasswordForm
            onBack={() => {
              setShowForgot(false);
              clearError();
            }}
          />
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            {/* Header con logo */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d6b7a 0%, #15a3ba 100%)",
                padding: "2.5rem 2rem 2rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <img
                src="/arco_logo.png"
                alt="ARCO Dental Studio"
                style={{
                  height: 110,
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "8rem",
                  height: "3px",
                  borderRadius: "9999px",
                  background:
                    "linear-gradient(90deg, transparent, #1ec3dd, transparent)",
                }}
              />
            </div>

            {/* Cuerpo */}
            <div style={{ padding: 32 }}>
              <h1
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#203F49",
                  margin: "0 0 24px",
                }}
              >
                Iniciar sesión
              </h1>

              {error && (
                <div style={{ marginBottom: 16 }}>
                  <Alert variant="error" message={error} onClose={clearError} />
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <Input
                  label="Usuario"
                  type="text"
                  placeholder="ej. maria.admin"
                  value={username}
                  onChange={(e) => {
                    clearError();
                    setUsername(e.target.value);
                  }}
                  autoComplete="username"
                  required
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => {
                    clearError();
                    setPassword(e.target.value);
                  }}
                  autoComplete="current-password"
                  required
                />

                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      clearError();
                    }}
                    onMouseEnter={() => setHoverForgot(true)}
                    onMouseLeave={() => setHoverForgot(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: hoverForgot ? "#0899B0" : "#5F656A",
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: hoverForgot ? "underline" : "none",
                      transition: "color 0.15s",
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                >
                  {isLoading ? "Validando..." : "Iniciar sesión"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
