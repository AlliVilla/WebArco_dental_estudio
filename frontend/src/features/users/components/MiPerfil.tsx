import { useState, useCallback, useEffect, useRef } from "react";
import {
  User,
  Key,
  LogOut,
  Shield,
  ChevronRight,
  Lock,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

import { FormSection, FullWidthField, ConfirmModal } from "../../../components";
import { Button, Input, Card, useTheme, PasswordInput } from "../../../context";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import profileTooth from "../../../assets/profile-tooth.png";
import { profileService } from "../services/profileService";
import { useResponsive } from "../../../hooks/useWindowWidth";

type Mode = "view" | "edit" | "changePassword";

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

interface ToastMsg {
  id: string;
  type: "success" | "error";
  message: string;
}

function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rules = checkRules(newPwd);
  const passwordsMatch = confirmPwd.length > 0 && newPwd === confirmPwd;
  const canSubmit = currentPwd.length > 0 && allPass(rules) && passwordsMatch;

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
      setLoading(false);
      onSuccess();
    } catch (err: unknown) {
      setLoading(false);
      const message =
        err instanceof Error ? err.message : "Error al cambiar la contraseña.";
      setError(message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PasswordInput
        label="Contraseña actual"
        badge="required"
        placeholder="Ingresa tu contraseña actual"
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
              {rules[key] ? <Check size={14} /> : <X size={14} />}
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
              color: newPwd === confirmPwd ? "#1D9E75" : "#E24B4A",
            }}
          >
            {newPwd === confirmPwd ? <Check size={14} /> : <X size={14} />}
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
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <Button
          variant="secondary"
          onClick={onSuccess}
          style={{ minWidth: 109 }}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
          style={{ minWidth: 170 }}
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </Button>
      </div>
    </div>
  );
}

export function MiPerfil() {
  useTheme();

  // ── Responsive ──────────────────────────────────────────────────────────────
  const { isMobile, isTablet } = useResponsive();
  const isStacked = isMobile || isTablet; // móvil e iPad: layout en columna
  // ────────────────────────────────────────────────────────────────────────────

  const user = useAuthStore((s) => s.user);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.persona?.correo_electronico ?? "");
  const [fullName, setFullName] = useState(
    user
      ? `${user.persona?.primer_nombre ?? ""} ${user.persona?.primer_apellido ?? ""}`.trim()
      : ""
  );
  const [roleName, setRoleName] = useState(user?.rol?.nombre ?? "Sin rol");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0); // Fix #2: useRef en lugar de variable global mutable

  const addToast = useCallback((type: ToastMsg["type"], message: string) => {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, type, message }]);
    // Fix #3: guardar el timer para hacer cleanup si el componente se desmonta
    const timer = setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
    return timer;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let isMounted = true; // Fix #3: evita setState en componente desmontado
    const timers: ReturnType<typeof setTimeout>[] = [];

    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);
        const profile = await profileService.getProfile();
        if (!isMounted) return;
        setUsername(profile.username ?? "");
        setEmail(profile.email ?? "");
        setFullName(profile.nombre ?? "");
        setRoleName(profile.rol ?? "Sin rol");
      } catch {
        // Fix #4: sin console.error en producción
        if (isMounted)
          timers.push(addToast("error", "No se pudo cargar el perfil."));
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    };
    void loadProfile();
    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
    };
  }, [addToast]);

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedFullName) {
      addToast("error", "Nombre de usuario, correo y nombre completo son obligatorios.");
      return;
    }

    // Validar formato de nombre de usuario: solo letras, números, puntos y guiones bajos
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      addToast(
        "error",
        "El nombre de usuario solo puede contener letras, números, puntos (.) y guiones bajos (_)."
      );
      return;
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      addToast("error", "El formato del correo electrónico ingresado es inválido.");
      return;
    }

    // Validar formato de nombre completo: solo letras (incluyendo acentos y ñ) y espacios
    const fullNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!fullNameRegex.test(trimmedFullName)) {
      addToast(
        "error",
        "El nombre completo solo puede contener letras y espacios."
      );
      return;
    }

    try {
      setIsProfileLoading(true);
      const profile = await profileService.updateProfile({
        username: trimmedUsername,
        email: trimmedEmail,
        nombre_completo: trimmedFullName,
      });
      setUsername(profile.username ?? "");
      setEmail(profile.email ?? "");
      setFullName(profile.nombre ?? "");
      setRoleName(profile.rol ?? "Sin rol");
      addToast("success", "Perfil actualizado correctamente.");
      setMode("view");
    } catch {
      // Fix #4: sin console.error en producción
      addToast("error", "No se pudo actualizar el perfil.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await useAuthStore.getState().logout();
  };

  const handlePwdChangeSuccess = () => {
    setMode("view");
    addToast("success", "Contraseña actualizada correctamente.");
  };

  const isEditing = mode === "edit";
  const isChangingPwd = mode === "changePassword";
  const displayFullName = fullName || "Usuario";
  const displayUsername = username || "usuario";
  const displayRole = roleName || "Sin rol";

  const nameParts = displayFullName.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length > 0
      ? `${nameParts[0]?.charAt(0)?.toUpperCase() ?? "U"}${
          nameParts[1]?.charAt(0)?.toUpperCase() ?? ""
        }`
      : "U";

  const formIcon = isChangingPwd ? (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "#E6F8FB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Lock size={16} color="#0BC5DF" />
    </div>
  ) : (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "#E6F8FB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <User size={16} color="#0BC5DF" />
    </div>
  );

  const formTitle = isChangingPwd ? "Cambiar contraseña" : "Editar Perfil";

  const formContent = isChangingPwd ? (
    <ChangePasswordForm onSuccess={handlePwdChangeSuccess} />
  ) : (
    <>
      <Input
        label="Nombre de usuario"
        badge="required"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={!isEditing || isProfileLoading}
      />
      <Input
        label="Correo electrónico"
        badge="required"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={!isEditing || isProfileLoading}
      />
      <FullWidthField>
        <Input
          label="Nombre completo"
          badge="required"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={!isEditing || isProfileLoading}
        />
      </FullWidthField>
      <FullWidthField
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 8,
          minHeight: 40,
        }}
      >
        {isEditing ? (
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isProfileLoading}
            style={{ width: isMobile ? "100%" : 153 }}
          >
            Guardar cambios
          </Button>
        ) : (
          <div style={{ width: 153 }} />
        )}
      </FullWidthField>
    </>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        padding: isMobile ? 0 : 24,
        maxWidth: 1150,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Título */}
      <div>
        <h1
          style={{
            fontSize: isMobile ? 20 : 24,
            fontWeight: 600,
            color: "var(--foreground)",
            margin: "0 0 4px 0",
          }}
        >
          Mi Perfil
        </h1>
        <p
          style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}
        >
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      {/* Banner */}
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          padding: isMobile ? "20px 16px" : "24px 32px",
          overflow: "hidden",
          background:
            "linear-gradient(360deg, #0DC8E2 0%, #0BC5DF 50%, #0bb1c7ff 100%)",
          display: "flex",
          alignItems: "center",
          minHeight: isMobile ? 110 : 140,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 14 : 20,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: isMobile ? 56 : 80,
              height: isMobile ? 56 : 80,
              borderRadius: 10,
              background: "rgba(255,255,255,0.25)",
              border: "1px solid #ffffff",
              boxShadow: "0 4px 14px rgba(32,63,73,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? 20 : 28,
              fontWeight: 600,
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h2
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700,
                color: "#ffffff",
                margin: "0 0 6px 0",
              }}
            >
              {isProfileLoading ? "Cargando perfil..." : displayFullName}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
                fontSize: 13,
                fontWeight: 500,
                color: "#ffffff",
              }}
            >
              <span>@{displayUsername}</span>
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#ffffff",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  background: "rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {displayRole}
              </span>
            </div>
          </div>
        </div>
        <img
          src={profileTooth}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -10,
            bottom: -55,
            width: 200,
            height: 200,
            objectFit: "contain",
            opacity: 0.2,
            mixBlendMode: "lighten",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Contenido: en stacked va en columna, en desktop en fila */}
      <div
        style={{
          display: "flex",
          flexDirection: isStacked ? "column" : "row",
          gap: isMobile ? 16 : 24,
          alignItems: "flex-start",
        }}
      >
        {/* Formulario */}
        <div
          style={{
            width: isStacked ? "100%" : 722,
            flexShrink: 0,
            borderRadius: 12,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <FormSection
            icon={formIcon}
            title={formTitle}
            columns={isChangingPwd || isMobile ? 1 : 2}
          >
            {formContent}
          </FormSection>
        </div>

        {/* Panel lateral */}
        <div
          style={{
            width: isStacked ? "100%" : 349,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Card
            style={{
              padding: "26px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderRadius: 12,
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
              border: "none",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#203F49",
                margin: "0 0 4px 0",
              }}
            >
              Acciones de cuenta
            </h3>

            <button
              onClick={() => setMode(isEditing ? "view" : "edit")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                border: "0.5px solid #D3D7DA",
                borderRadius: 10,
                padding: "0 16px",
                height: 66,
                cursor: "pointer",
                background: isEditing ? "#0BC5DF" : "#E6F8FB",
                fontFamily: "inherit",
                fontSize: 14,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: isEditing ? "#fff" : "#0BC5DF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isEditing ? "#0BC5DF" : "#fff",
                  flexShrink: 0,
                }}
              >
                <User size={16} />
              </div>
              <span style={{ flex: 1, color: isEditing ? "#fff" : "#203F49" }}>
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </span>
              <ChevronRight size={16} color={isEditing ? "#fff" : "#888F94"} />
            </button>

            <button
              onClick={() => setMode(isChangingPwd ? "view" : "changePassword")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                border: "0.5px solid #D3D7DA",
                borderRadius: 10,
                padding: "0 16px",
                height: 66,
                cursor: "pointer",
                background: isChangingPwd ? "#0BC5DF" : "#fff",
                fontFamily: "inherit",
                fontSize: 14,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: isChangingPwd ? "#fff" : "#E6F8FB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isChangingPwd ? "#0BC5DF" : "#203F49",
                  flexShrink: 0,
                }}
              >
                <Key size={16} />
              </div>
              <span
                style={{ flex: 1, color: isChangingPwd ? "#fff" : "#203F49" }}
              >
                {isChangingPwd ? "Cancelar" : "Cambiar Contraseña"}
              </span>
              <ChevronRight
                size={16}
                color={isChangingPwd ? "#fff" : "#888F94"}
              />
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                border: "0.5px solid #D3D7DA",
                borderRadius: 10,
                padding: "0 16px",
                height: 66,
                cursor: "pointer",
                background: "#fff",
                fontFamily: "inherit",
                fontSize: 14,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#F8F9FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E24B4A",
                  flexShrink: 0,
                }}
              >
                <LogOut size={16} />
              </div>
              <span style={{ flex: 1, color: "#E24B4A" }}>Cerrar Sesión</span>
              <ChevronRight size={16} color="#E24B4A" />
            </button>
          </Card>

          <Card
            style={{
              padding: "20px 16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              background: "var(--background)",
              borderRadius: 12,
              boxShadow:
                "0 1px 3px rgba(184,49,49,0.08), 0 4px 12px rgba(0,0,0,0.05)",
              border: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#0BC5DF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#203F49",
                  margin: "0 0 4px 0",
                }}
              >
                Seguridad de la cuenta
              </h4>
              <p
                style={{
                  fontSize: 13,
                  color: "#5F656A",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                Mantén tu cuenta segura actualizando tu contraseña regularmente.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        variant="danger"
        title="Cerrar Sesión"
        description="¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a ingresar tus credenciales para acceder."
        confirmLabel="Cerrar Sesión"
      />

      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 24,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => {
            const colors = {
              success: { bg: "#1D9E75", icon: <Check size={16} /> },
              error: { bg: "#E24B4A", icon: <AlertCircle size={16} /> },
            }[t.type];
            return (
              <div
                key={t.id}
                style={{
                  pointerEvents: "all",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#fff",
                  border: `1.5px solid ${colors.bg}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  minWidth: 280,
                  maxWidth: 380,
                }}
              >
                <span style={{ color: colors.bg }}>{colors.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#203F49" }}>
                  {t.message}
                </span>
                <button
                  onClick={() => removeToast(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#888F94",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
