import React, { useState } from "react";
import { authService } from "../services/authService";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  onBack: () => void;
}

function checkRules(pwd: string) {
  return {
    minLength: pwd.length >= 8,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSymbol: /[^A-Za-z0-9]/.test(pwd),
  };
}
function allPass(r: ReturnType<typeof checkRules>) {
  return Object.values(r).every(Boolean);
}

function PasswordChecklist({ pwd }: { pwd: string }) {
  const r = checkRules(pwd);
  const items: [keyof ReturnType<typeof checkRules>, string][] = [
    ["minLength", "Mínimo 8 caracteres"],
    ["hasLower", "Al menos una minúscula"],
    ["hasUpper", "Al menos una mayúscula"],
    ["hasNumber", "Al menos un número"],
    ["hasSymbol", "Al menos un símbolo"],
  ];
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "0.75rem 0 0",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {items.map(([key, label]) => (
        <li
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.875rem",
            color: r[key] ? "#1aaf5d" : "#d14343",
          }}
        >
          <span style={{ fontWeight: 700 }}>{r[key] ? "✓" : "✕"}</span> {label}
        </li>
      ))}
    </ul>
  );
}

export const ForgotPasswordForm: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const rules = checkRules(newPwd);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await authService.forgotPassword(email);
      setSuccessMsg(
        "Si el correo existe, recibirás un enlace de recuperación."
      );
      setStep(2);
    } catch (err: any) {
      setError(
        err?.message || "No se pudo enviar el enlace. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!allPass(rules)) {
      setError("La contraseña no cumple todos los requisitos.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: newPwd });
      setSuccessMsg("¡Contraseña actualizada! Redirigiendo al inicio...");
      setTimeout(onBack, 2000);
    } catch (err: any) {
      setError(
        err?.message || "Token inválido o expirado. Solicita un nuevo enlace."
      );
    } finally {
      setLoading(false);
    }
  };

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
  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "1rem",
    border: "none",
    borderRadius: "1rem",
    background: "#1ec3dd",
    color: "#fff",
    fontSize: "1.05rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(30,195,221,0.35)",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "1.75rem",
        boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
    >
      {/* Header teal con logo + línea divisoria cian */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d6b7a 0%, #15a3ba 100%)",
          padding: "2.5rem 2rem 2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderBottom: "4px solid #1ec3dd",
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
      </div>

      {/* Cuerpo */}
      <div style={{ padding: "2rem 2.25rem 2.5rem" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: "1.9rem",
            fontWeight: 800,
            color: "#1f2d3d",
            margin: "0 0 0.5rem",
          }}
        >
          {step === 1 ? "Recuperar acceso" : "Nueva contraseña"}
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#7a828b",
            fontSize: "0.95rem",
            margin: "0 0 1.75rem",
          }}
        >
          {step === 1
            ? "Ingresa tu correo registrado para recibir el enlace."
            : "Pega el token del correo y escribe tu nueva contraseña."}
        </p>

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
        {successMsg && (
          <div
            style={{
              background: "#e8f8ef",
              color: "#1aaf5d",
              fontSize: "0.9rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              marginBottom: "1.25rem",
              border: "1px solid #b8e6cb",
            }}
          >
            {successMsg}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle} htmlFor="forgot-email">
                Email registrado
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                style={inputStyle}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle} htmlFor="reset-token">
                Token del correo
              </label>
              <input
                id="reset-token"
                type="text"
                required
                style={inputStyle}
                placeholder="Pega el token aquí"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle} htmlFor="new-pwd">
                Nueva contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-pwd"
                  type={showPwd ? "text" : "password"}
                  required
                  style={{ ...inputStyle, paddingRight: "3rem" }}
                  placeholder="Mínimo 8 caracteres"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
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
              {newPwd.length > 0 && <PasswordChecklist pwd={newPwd} />}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle} htmlFor="confirm-pwd">
                Confirmar contraseña
              </label>
              <input
                id="confirm-pwd"
                type="password"
                required
                style={inputStyle}
                placeholder="Repite la contraseña"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
              {confirmPwd.length > 0 && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    marginTop: 6,
                    color: newPwd === confirmPwd ? "#1aaf5d" : "#d14343",
                  }}
                >
                  {newPwd === confirmPwd
                    ? "✓ Las contraseñas coinciden"
                    : "✕ No coinciden"}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                ...btnStyle,
                opacity:
                  loading || !allPass(rules) || newPwd !== confirmPwd ? 0.6 : 1,
              }}
              disabled={loading || !allPass(rules) || newPwd !== confirmPwd}
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            background: "none",
            border: "none",
            color: "#5a6671",
            fontSize: "0.95rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
