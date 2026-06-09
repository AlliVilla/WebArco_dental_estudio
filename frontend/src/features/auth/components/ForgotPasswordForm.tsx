import React, { useState } from "react";
import { authService } from "../services/authService";

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
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {items.map(([key, label]) => (
        <li
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.8rem",
            color: r[key] ? "var(--success)" : "var(--danger)",
          }}
        >
          {r[key] ? "✓" : "✗"} {label}
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
    try {
      await authService.forgotPassword(email);
      setSuccessMsg(
        "Si el correo existe, recibirás un enlace de recuperación."
      );
      setStep(2);
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      setSuccessMsg("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(onBack, 2000);
    } catch {
      setError("Token inválido o expirado. Solicitá un nuevo enlace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="glass-card animate-slide"
      style={{
        padding: "2.5rem",
        width: "100%",
        maxWidth: 440,
        margin: "0 auto",
      }}
    >
      <h2
        style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}
      >
        {step === 1 ? "Recuperar acceso" : "Nueva contraseña"}
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          marginBottom: "1.5rem",
        }}
      >
        {step === 1
          ? "Ingresa tu correo registrado para recibir el enlace."
          : "Pegá el token del correo y escribí tu nueva contraseña."}
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
      {successMsg && (
        <div
          className="badge badge-success"
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
          {successMsg}
        </div>
      )}

      {step === 1 && (
        <form
          onSubmit={handleForgot}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              Correo electrónico
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              className="form-input"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem" }}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={handleReset}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="reset-token">
              Token del correo
            </label>
            <input
              id="reset-token"
              type="text"
              required
              className="form-input"
              placeholder="Pegá el token aquí"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-pwd">
              Nueva contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="new-pwd"
                type={showPwd ? "text" : "password"}
                required
                className="form-input"
                style={{ paddingRight: "2.8rem" }}
                placeholder="Mínimo 8 caracteres"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
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
                  padding: 0,
                }}
              >
                {showPwd ? "🙈" : "👁"}
              </button>
            </div>
            {newPwd.length > 0 && <PasswordChecklist pwd={newPwd} />}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pwd">
              Confirmar contraseña
            </label>
            <input
              id="confirm-pwd"
              type="password"
              required
              className="form-input"
              placeholder="Repite la contraseña"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
            {confirmPwd.length > 0 && (
              <p
                style={{
                  fontSize: "0.8rem",
                  marginTop: 4,
                  color:
                    newPwd === confirmPwd ? "var(--success)" : "var(--danger)",
                }}
              >
                {newPwd === confirmPwd ? "✓ Coinciden" : "✗ No coinciden"}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem" }}
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
          marginTop: "1.25rem",
          width: "100%",
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        ← Volver al inicio de sesión
      </button>
    </div>
  );
};
