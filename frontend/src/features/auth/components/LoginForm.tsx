import React, { useState } from "react";
import { useAuthStore } from "../hooks/useAuthStore";
import { KeyRound, User as UserIcon, Lock, Eye, EyeOff } from "lucide-react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import heroBg from "../../../assets/hero.png";

export const LoginForm: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login(username, password);
    } catch {
      /* manejado en store */
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
        }}
      >
        {showForgot ? (
          <ForgotPasswordForm
            onBack={() => {
              setShowForgot(false);
              clearError();
            }}
          />
        ) : (
          <div
            className="glass-card animate-slide"
            style={{ overflow: "hidden" }}
          >
            {/* Header */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--hue-primary), 85%, 35%), hsl(var(--hue-primary), 85%, 45%))",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "50%",
                  padding: "0.85rem",
                  display: "flex",
                }}
              >
                <KeyRound size={28} color="#fff" />
              </div>
              {/* Si tenés logo: <img src="/arco_logo.png" alt="ARCO" style={{ height: 48 }} /> */}
              <h1
                style={{
                  color: "#fff",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                ARCO{" "}
                <span style={{ fontWeight: 400, opacity: 0.85 }}>
                  Dental Studio
                </span>
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.8rem",
                  margin: 0,
                }}
              >
                Sistema de Gestión Clínica
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                }}
              >
                Bienvenido
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  marginBottom: "1.5rem",
                }}
              >
                Ingresa tus credenciales para continuar
              </p>

              {error && (
                <div
                  className="badge badge-danger"
                  style={{
                    width: "100%",
                    padding: "0.65rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "1rem",
                    display: "block",
                    textTransform: "none",
                    letterSpacing: "normal",
                    lineHeight: 1.4,
                  }}
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="login-user"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <UserIcon size={13} /> Usuario
                  </label>
                  <input
                    id="login-user"
                    type="text"
                    required
                    className="form-input"
                    placeholder="ej. maria.admin"
                    value={username}
                    autoComplete="username"
                    onChange={(e) => {
                      clearError();
                      setUsername(e.target.value);
                    }}
                  />
                </div>

                <div className="form-group">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <label
                      className="form-label"
                      htmlFor="login-pwd"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 0,
                      }}
                    >
                      <Lock size={13} /> Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(true);
                        clearError();
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--primary)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="login-pwd"
                      type={showPwd ? "text" : "password"}
                      required
                      className="form-input"
                      style={{ paddingRight: "2.8rem" }}
                      placeholder="••••••••"
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => {
                        clearError();
                        setPassword(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    marginTop: "0.5rem",
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spinSlow 1s linear infinite",
                        margin: "0 auto",
                      }}
                    />
                  ) : (
                    "Ingresar al Sistema"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
