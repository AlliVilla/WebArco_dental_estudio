import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Key,
  Lock,
  LogOut,
  Shield,
  User,
  X,
} from 'lucide-react';

import { ConfirmModal, FormSection, FullWidthField } from '../../../components';
import { Button, Card, Input, PasswordInput, useTheme } from '../../../context';
import profileTooth from '../../../assets/profile-tooth.png';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { profileService } from '../services/profileService';

type Mode = 'view' | 'edit' | 'changePassword';

interface PasswordRules {
  minLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

interface ToastMsg {
  id: string;
  type: 'success' | 'error';
  message: string;
}

let toastId = 0;

const RULES_ITEMS: [keyof PasswordRules, string][] = [
  ['minLength', 'Mínimo 8 caracteres'],
  ['hasLower', 'Al menos una minúscula'],
  ['hasUpper', 'Al menos una mayúscula'],
  ['hasNumber', 'Al menos un número'],
  ['hasSymbol', 'Al menos un símbolo'],
];

function checkRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}

function allPass(rules: PasswordRules): boolean {
  return Object.values(rules).every(Boolean);
}

function ChangePasswordForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rules = checkRules(newPwd);
  const passwordsMatch = confirmPwd.length > 0 && newPwd === confirmPwd;
  const canSubmit = currentPwd.length > 0 && allPass(rules) && passwordsMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      await profileService.changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
        confirmPassword: confirmPwd,
      });

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar la contraseña.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PasswordInput
        label="Contraseña actual"
        badge="required"
        placeholder="Ingresa tu contraseña actual"
        value={currentPwd}
        onChange={(event) => setCurrentPwd(event.target.value)}
      />

      <div>
        <PasswordInput
          label="Nueva contraseña"
          badge="required"
          placeholder="Mínimo 8 caracteres"
          value={newPwd}
          onChange={(event) => setNewPwd(event.target.value)}
        />

        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            listStyle: 'none',
            margin: '10px 0 0',
            padding: 0,
          }}
        >
          {RULES_ITEMS.map(([key, label]) => (
            <li
              key={key}
              style={{
                alignItems: 'center',
                color: rules[key] ? 'var(--arco-success)' : 'var(--arco-danger)',
                display: 'flex',
                fontSize: 13,
                gap: 8,
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
          onChange={(event) => setConfirmPwd(event.target.value)}
        />

        {confirmPwd.length > 0 ? (
          <p
            style={{
              alignItems: 'center',
              color: passwordsMatch ? 'var(--arco-success)' : 'var(--arco-danger)',
              display: 'flex',
              fontSize: 13,
              gap: 6,
              margin: '8px 0 0',
            }}
          >
            {passwordsMatch ? <Check size={14} /> : <X size={14} />}
            {passwordsMatch ? 'Las contraseñas coinciden' : 'No coinciden'}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          style={{
            alignItems: 'center',
            color: 'var(--arco-danger)',
            display: 'flex',
            fontSize: 13,
            gap: 6,
            margin: 0,
          }}
        >
          <AlertCircle size={14} />
          {error}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" onClick={onCancel} style={{ minWidth: 109 }}>
          Cancelar
        </Button>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
          style={{ minWidth: 170 }}
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </div>
    </div>
  );
}

export function MiPerfil() {
  useTheme();

  const user = useAuthStore((state) => state.user);

  const [mode, setMode] = useState<Mode>('view');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.persona?.correo ?? '');
  const [fullName, setFullName] = useState(
    user ? `${user.persona?.nombre ?? ''} ${user.persona?.apellido ?? ''}`.trim() : '',
  );
  const [roleName, setRoleName] = useState(user?.rol?.nombre ?? 'Sin rol');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback((type: ToastMsg['type'], message: string) => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);

        const profile = await profileService.getProfile();

        setUsername(profile.username ?? '');
        setEmail(profile.email ?? '');
        setFullName(profile.nombre ?? '');
        setRoleName(profile.rol ?? 'Sin rol');
      } catch (error) {
        console.error('Error cargando perfil:', error);
        addToast('error', 'No se pudo cargar el perfil.');
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadProfile();
  }, [addToast]);

  const handleSave = async () => {
    if (!username.trim() || !email.trim() || !fullName.trim()) {
      addToast('error', 'Username, correo y nombre completo son obligatorios.');
      return;
    }

    try {
      setIsProfileLoading(true);

      const profile = await profileService.updateProfile({
        username: username.trim(),
        email: email.trim(),
        nombre_completo: fullName.trim(),
      });

      setUsername(profile.username ?? '');
      setEmail(profile.email ?? '');
      setFullName(profile.nombre ?? '');
      setRoleName(profile.rol ?? 'Sin rol');

      addToast('success', 'Perfil actualizado correctamente.');
      setMode('view');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      addToast('error', 'No se pudo actualizar el perfil.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await useAuthStore.getState().logout();
  };

  const handlePwdChangeSuccess = () => {
    setMode('view');
    addToast('success', 'Contraseña actualizada correctamente.');
  };

  const isEditing = mode === 'edit';
  const isChangingPwd = mode === 'changePassword';

  const displayFullName = fullName || 'Usuario';
  const displayUsername = username || 'usuario';
  const displayRole = roleName || 'Sin rol';

  const nameParts = displayFullName.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length > 0
      ? `${nameParts[0]?.charAt(0)?.toUpperCase() ?? 'U'}${
          nameParts[1]?.charAt(0)?.toUpperCase() ?? ''
        }`
      : 'U';

  const formIcon = (
    <div
      style={{
        alignItems: 'center',
        background: 'var(--arco-primary-light)',
        borderRadius: 8,
        display: 'flex',
        height: 32,
        justifyContent: 'center',
        width: 32,
      }}
    >
      {isChangingPwd ? (
        <Lock size={16} color="var(--arco-primary)" />
      ) : (
        <User size={16} color="var(--arco-primary)" />
      )}
    </div>
  );

  const formTitle = isChangingPwd ? 'Cambiar contraseña' : 'Editar Perfil';

  const formContent = isChangingPwd ? (
    <ChangePasswordForm
      onCancel={() => setMode('view')}
      onSuccess={handlePwdChangeSuccess}
    />
  ) : (
    <>
      <Input
        label="Username"
        badge="required"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={!isEditing || isProfileLoading}
      />

      <Input
        label="Correo electrónico"
        badge="required"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={!isEditing || isProfileLoading}
      />

      <FullWidthField>
        <Input
          label="Nombre completo"
          badge="required"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={!isEditing || isProfileLoading}
        />
      </FullWidthField>

      <FullWidthField
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 8,
          minHeight: 40,
        }}
      >
        {isEditing ? (
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isProfileLoading}
            style={{ width: 153 }}
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
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        margin: '0 auto',
        maxWidth: 1150,
        padding: 24,
        width: '100%',
      }}
    >
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <div>
        <h1
          style={{
            color: 'var(--foreground)',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Mi Perfil
        </h1>

        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 14,
            margin: 0,
          }}
        >
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(360deg, #0BC5DF 0%, #0BC5DF 50%, #0899B0 100%)',
          borderRadius: 12,
          display: 'flex',
          minHeight: 140,
          overflow: 'hidden',
          padding: '24px 32px',
          position: 'relative',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 20, zIndex: 1 }}>
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid #ffffff',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(32, 63, 73, 0.18)',
              color: '#ffffff',
              display: 'flex',
              flexShrink: 0,
              fontSize: 28,
              fontWeight: 600,
              height: 80,
              justifyContent: 'center',
              width: 80,
            }}
          >
            {initials}
          </div>

          <div>
            <h2
              style={{
                color: '#ffffff',
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 6px 0',
              }}
            >
              {isProfileLoading ? 'Cargando perfil...' : displayFullName}
            </h2>

            <div
              style={{
                alignItems: 'center',
                color: '#ffffff',
                display: 'flex',
                fontSize: 13,
                fontWeight: 500,
                gap: 8,
              }}
            >
              <span>@{displayUsername}</span>
              <span
                style={{
                  background: '#ffffff',
                  borderRadius: '50%',
                  flexShrink: 0,
                  height: 4,
                  width: 4,
                }}
              />
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 10px',
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
            bottom: -55,
            height: 200,
            mixBlendMode: 'lighten',
            objectFit: 'contain',
            opacity: 0.2,
            pointerEvents: 'none',
            position: 'absolute',
            right: -10,
            width: 200,
          }}
        />
      </div>

      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 24 }}>
        <div
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
            flexShrink: 0,
            overflow: 'hidden',
            width: 722,
          }}
        >
          <FormSection icon={formIcon} title={formTitle} columns={2}>
            {formContent}
          </FormSection>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            gap: 16,
            width: 349,
          }}
        >
          <Card
            style={{
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '26px 16px',
            }}
          >
            <h3
              style={{
                color: 'var(--foreground)',
                fontSize: 14,
                fontWeight: 600,
                margin: '0 0 4px 0',
              }}
            >
              Acciones de cuenta
            </h3>

            <AccountActionButton
              active={mode === 'edit'}
              icon={<User size={16} />}
              label="Editar Perfil"
              onClick={() => setMode('edit')}
            />

            <AccountActionButton
              active={mode === 'changePassword'}
              icon={<Key size={16} />}
              label="Cambiar Contraseña"
              onClick={() => setMode('changePassword')}
            />

            <AccountActionButton
              danger
              icon={<LogOut size={16} />}
              label="Cerrar Sesión"
              onClick={() => setShowLogoutModal(true)}
            />
          </Card>

          <Card
            style={{
              alignItems: 'flex-start',
              background: 'var(--background)',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(184, 49, 49, 0.08), 0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              gap: 12,
              padding: '20px 16px',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                background: 'var(--arco-primary)',
                borderRadius: 8,
                color: '#ffffff',
                display: 'flex',
                flexShrink: 0,
                height: 36,
                justifyContent: 'center',
                width: 36,
              }}
            >
              <Shield size={18} />
            </div>

            <div>
              <h4
                style={{
                  color: 'var(--foreground)',
                  fontSize: 14,
                  fontWeight: 600,
                  margin: '0 0 4px 0',
                }}
              >
                Seguridad de la cuenta
              </h4>

              <p
                style={{
                  color: 'var(--arco-gray-700)',
                  fontSize: 13,
                  lineHeight: 1.4,
                  margin: 0,
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
    </div>
  );
}

function AccountActionButton({
  active = false,
  danger = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  danger?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const color = danger ? 'var(--arco-danger)' : active ? 'var(--arco-primary)' : 'var(--foreground)';

  return (
    <button
      onClick={onClick}
      style={{
        alignItems: 'center',
        background: active ? 'var(--arco-primary-light)' : 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'inherit',
        fontSize: 14,
        gap: 12,
        height: 66,
        padding: '0 16px',
        textAlign: 'left',
        width: '100%',
      }}
      type="button"
    >
      <div
        style={{
          alignItems: 'center',
          background: active
            ? 'var(--arco-primary)'
            : danger
              ? 'var(--arco-gray-50)'
              : 'var(--arco-primary-light)',
          borderRadius: 8,
          color: active ? '#ffffff' : color,
          display: 'flex',
          flexShrink: 0,
          height: 36,
          justifyContent: 'center',
          width: 36,
        }}
      >
        {icon}
      </div>

      <span style={{ color, flex: 1 }}>{label}</span>
      <ChevronRight size={16} color={danger ? 'var(--arco-danger)' : 'var(--arco-gray-500)'} />
    </button>
  );
}

function ToastStack({
  onRemove,
  toasts,
}: {
  onRemove: (id: string) => void;
  toasts: ToastMsg[];
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'fixed',
        right: 24,
        top: 24,
        zIndex: 100,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            alignItems: 'center',
            background: 'var(--card)',
            border: `1px solid ${
              toast.type === 'success' ? 'var(--arco-success)' : 'var(--arco-danger)'
            }`,
            borderRadius: 10,
            boxShadow: '0 12px 32px rgba(32, 63, 73, 0.16)',
            color: 'var(--foreground)',
            display: 'flex',
            fontSize: 13,
            gap: 10,
            minWidth: 280,
            padding: '12px 14px',
          }}
        >
          {toast.type === 'success' ? (
            <Check size={16} color="var(--arco-success)" />
          ) : (
            <AlertCircle size={16} color="var(--arco-danger)" />
          )}

          <span style={{ flex: 1 }}>{toast.message}</span>

          <button
            onClick={() => onRemove(toast.id)}
            style={{
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--arco-gray-500)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              padding: 0,
            }}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}