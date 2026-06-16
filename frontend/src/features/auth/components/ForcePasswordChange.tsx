import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  AlertCircle,
  Lock,
  Shield,
  Info,
} from "lucide-react";
import { Button, PasswordInput } from "../../../context";
import { useAuthStore } from "../hooks/useAuthStore";
import { profileService } from "../../users/services/profileService";
import heroBg from "../../../assets/hero.png";

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

const RULES_ITEMS: [keyof PasswordRules, string][] = [
  ["minLength", "Mínimo 8 caracteres"],
  ["hasLower", "Al menos una minúscula"],
  ["hasUpper", "Al menos una mayúscula"],
  ["hasNumber", "Al menos un número"],
  ["hasSymbol", "Al menos un símbolo"],
];

export function ForcePasswordChange() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rules = checkRules(newPwd);
  const passwordsMatch = confirmPwd.length > 0 && newPwd === confirmPwd;
  const canSubmit =
    currentPwd.length > 0 && allPass(rules) && passwordsMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await profileService.changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
        confirmPassword: confirmPwd,
      });
      if (user) {
        const updatedUser = { ...user, must_change_password: false };
        updateUser(updatedUser);
      }
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al cambiar la contraseña.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    navigate("/login", { replace: true });
  };

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
      <div style={{ width: "100%", maxWidth: 480 }}>
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
              background:
                "linear-gradient(135deg, #0d6b7a 0%, #15a3ba 100%)",
              padding: "2rem 2rem 1.5rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Lock size={28} color="#fff" />
            </div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 4px",
              }}
            >
              Cambio de contraseña obligatorio
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.85)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Por seguridad, debes cambiar tu contraseña antes de continuar.
            </p>
          </div>

          <div style={{ padding: 32 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 8,
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
                marginBottom: 24,
                alignItems: "flex-start",
              }}
            >
              <Info size={18} color="#0EA5E9" style={{ flexShrink: 0, marginTop: 1 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#0369A1",
                  lineHeight: 1.4,
                }}
              >
                Usuario: <strong>{user?.username}</strong>. Ingresa tu
                contraseña temporal y luego establece una nueva.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <PasswordInput
                label="Contraseña actual (temporal)"
                badge="required"
                placeholder="Ingresa tu contraseña temporal"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
              />

              <div>
                <PasswordInput
                  label="Nueva contraseña"
                  badge="required"
                  placeholder="Mínimo 8 caracteres"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
                <ul
                  style={{
                    listStyle: "none",
                    margin: "10px 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {RULES_ITEMS.map(([key, label]) => (
                    <li
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: rules[key] ? "#1D9E75" : "#E24B4A",
                      }}
                    >
                      {rules[key] ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <PasswordInput
                  label="Confirmar nueva contraseña"
                  badge="required"
                  placeholder="Repite la nueva contraseña"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
                {confirmPwd.length > 0 && (
                  <p
                    style={{
                      fontSize: 13,
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color:
                        newPwd === confirmPwd ? "#1D9E75" : "#E24B4A",
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

              {error && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#E24B4A",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: 0,
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </p>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={loading}
              >
                {loading
                  ? "Actualizando..."
                  : "Cambiar contraseña y continuar"}
              </Button>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#888F94",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "underline",
                    fontFamily: "inherit",
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: "12px 16px",
                borderRadius: 8,
                background: "#F8F9FA",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <Shield size={16} color="#5F656A" style={{ flexShrink: 0, marginTop: 2 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#5F656A",
                  lineHeight: 1.4,
                }}
              >
                La contraseña debe cumplir con los requisitos de seguridad
                indicados. Una vez cambiada, podrás acceder a todas las
                funcionalidades del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
