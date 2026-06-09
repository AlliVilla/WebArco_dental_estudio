import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Mail } from "lucide-react";
import { Button, Input, PasswordInput, Alert } from "../../../context";
import { authService } from "../services/authService";

export interface ForgotPasswordFormProps {
  onBack?: () => void;
  initialToken?: string;
}

interface PasswordRules {
  minLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

function checkRules(pwd: string): PasswordRules {
  return {
    minLength: pwd.length >= 8,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSymbol: /[^A-Za-z0-9]/.test(pwd),
  };
}

function allPass(r: PasswordRules): boolean {
  return Object.values(r).every(Boolean);
}

function PasswordChecklist({ pwd }: { pwd: string }) {
  const r = checkRules(pwd);
  const items: [keyof PasswordRules, string][] = [
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
        margin: "8px 0 0",
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
            fontSize: 13,
            color: r[key] ? "#1D9E75" : "#E24B4A",
          }}
        >
          {r[key] ? <Check size={14} /> : <X size={14} />}
          {label}
        </li>
      ))}
    </ul>
  );
}

export function ForgotPasswordForm({
  onBack,
  initialToken = "",
}: ForgotPasswordFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [hoverBack, setHoverBack] = useState(false);

  const rules = checkRules(newPwd);
  const tokenFromUrl = initialToken.length > 0;

  function handleBack() {
    if (onBack) onBack();
    else navigate("/login");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setSentEmail(email);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el enlace. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
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
      setError("");
      setTimeout(handleBack, 2000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Token inválido o expirado. Solicita un nuevo enlace."
      );
    } finally {
      setLoading(false);
    }
  }

  if (sentEmail) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0d6b7a 0%, #15a3ba 100%)",
            padding: "2.5rem 2rem 2rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
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

        <div style={{ padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#E6F8FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Mail size={28} color="#0BC5DF" />
          </div>

          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#203F49",
              margin: "0 0 8px",
            }}
          >
            Revisa tu correo
          </h1>

          <p
            style={{
              fontSize: 13,
              color: "#888F94",
              lineHeight: "1.5",
              margin: "0 0 24px",
            }}
          >
            Hemos enviado un enlace de recuperación a{" "}
            <strong style={{ color: "#203F49" }}>{sentEmail}</strong>.
            Haz clic en el enlace para restablecer tu contraseña.
          </p>

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Button variant="primary" size="lg" fullWidth>
              Ir a Gmail
            </Button>
          </a>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              type="button"
              onClick={handleBack}
              onMouseEnter={() => setHoverBack(true)}
              onMouseLeave={() => setHoverBack(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: hoverBack ? "#0899B0" : "#5F656A",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: hoverBack ? "underline" : "none",
                transition: "color 0.15s",
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}
    >
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
              "linear-gradient(90deg, transparent, #0BC5DF, transparent)",
          }}
        />
      </div>

      <div style={{ padding: 32 }}>
        {tokenFromUrl ? (
          <>
            <h1
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: 600,
                color: "#203F49",
                margin: "0 0 6px",
              }}
            >
              Nueva contraseña
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 13,
                margin: "0 0 20px",
              }}
            >
              Define tu nueva contraseña para continuar.
            </p>

            {error && (
              <div style={{ marginBottom: 16 }}>
                <Alert variant="error" message={error} />
              </div>
            )}

            <form
              onSubmit={handleReset}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <PasswordInput
                  label="Nueva contraseña"
                  placeholder="Mínimo 8 caracteres"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                />
                {newPwd.length > 0 && <PasswordChecklist pwd={newPwd} />}
              </div>

              <div>
                <PasswordInput
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
                {confirmPwd.length > 0 && (
                  <p
                    style={{
                      fontSize: 13,
                      marginTop: 6,
                      color: newPwd === confirmPwd ? "#1D9E75" : "#E24B4A",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {newPwd === confirmPwd ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    {newPwd === confirmPwd
                      ? "Las contraseñas coinciden"
                      : "No coinciden"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={
                  loading || !allPass(rules) || newPwd !== confirmPwd
                }
              >
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: 600,
                color: "#203F49",
                margin: "0 0 6px",
              }}
            >
              Recuperar acceso
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 13,
                margin: "0 0 20px",
              }}
            >
              Ingresa tu correo registrado para recibir un enlace de
              recuperación.
            </p>

            {error && (
              <div style={{ marginBottom: 16 }}>
                <Alert variant="error" message={error} />
              </div>
            )}

            <form
              onSubmit={handleForgot}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          </>
        )}

        {!tokenFromUrl && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              type="button"
              onClick={handleBack}
              onMouseEnter={() => setHoverBack(true)}
              onMouseLeave={() => setHoverBack(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: hoverBack ? "#0899B0" : "#5F656A",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: hoverBack ? "underline" : "none",
                transition: "color 0.15s",
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
