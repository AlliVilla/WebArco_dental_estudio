import React, { useState } from "react";
import { useAuthStore } from "../hooks/useAuthStore";
import { Eye, EyeOff } from "lucide-react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import heroBg from "../../../assets/hero.png";

export const LoginForm: React.FC = () => {
  const { login, error, isLoading, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [hoverForgot, setHoverForgot] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login(username, password);
    } catch {
      /* manejado en store */
    }
  };

  // Estilos compartidos
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.95rem",
    color: "#4a4a4a",
    marginBottom: "0.5rem",
    fontWeight: 400,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.95rem 1.1rem",
    background: "#f1f3f5",
    border: "none",
    borderRadius: "0.85rem",
    fontSize: "1rem",
    color: "#1f2d3d",
    outline: "none",
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
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
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
            style={{
              background: "#ffffff",
              borderRadius: "1.75rem",
              boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {/* Header con degradado teal + logo */}
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
                  height: 120,
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
            <div style={{ padding: "2rem 2.25rem 2.5rem" }}>
              <h1
                style={{
                  textAlign: "center",
                  fontSize: "2.1rem",
                  fontWeight: 800,
                  color: "#1f2d3d",
                  margin: "0 0 2rem",
                }}
              >
                Login
              </h1>

              {error && (
                <div
                  style={{
                    background: "#fdecea",
                    color: "#c0392b",
                    fontSize: "0.9rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    marginBottom: "1.25rem",
                    border: "1px solid #f5c6cb",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email / Usuario */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={labelStyle} htmlFor="login-user">
                    Email
                  </label>
                  <input
                    id="login-user"
                    type="text"
                    required
                    style={inputStyle}
                    placeholder="tu@email.com"
                    value={username}
                    onChange={(e) => {
                      clearError();
                      setUsername(e.target.value);
                    }}
                    autoComplete="username"
                  />
                </div>

                {/* Contraseña */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={labelStyle} htmlFor="login-pwd">
                    Contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="login-pwd"
                      type={showPwd ? "text" : "password"}
                      required
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        clearError();
                        setPassword(e.target.value);
                      }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#8a9199",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Olvidaste contraseña */}
                <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
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
                      color: hoverForgot ? "#1ec3dd" : "#5a6671",
                      fontSize: "0.95rem",
                      textDecoration: hoverForgot ? "underline" : "none",
                      transition: "color 0.2s",
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Botón */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "none",
                    borderRadius: "1rem",
                    background: "#1ec3dd",
                    color: "#fff",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    cursor: isLoading ? "default" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    boxShadow: "0 8px 20px rgba(30,195,221,0.35)",
                    transition: "opacity 0.2s",
                  }}
                >
                  {isLoading ? "Validando..." : "Iniciar sesión"}
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
