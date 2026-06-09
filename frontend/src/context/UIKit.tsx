import React from 'react';
import { Eye, EyeOff, ChevronDown, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ─── Badge Components ────────────────────────────────────────────────────────

interface FieldBadgeProps { type: 'required' | 'optional' | 'conditional' }
export function FieldBadge({ type }: FieldBadgeProps) {
  if (type === 'required') {
    return (
      <span style={{
        color: '#E24B4A', fontSize: 14, fontWeight: 700, lineHeight: 1,
      }}>*</span>
    );
  }
  const map = {
    optional: { label: 'Opcional', bg: '#F8F9FA', color: '#888F94', border: '#D3D7DA' },
    conditional: { label: 'Condicional', bg: '#FFFBEB', color: '#EF9F27', border: '#FDE68A' },
  };
  const s = map[type];
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
      background: s.bg, color: s.color, border: `0.5px solid ${s.border}`,
    }}>{s.label}</span>
  );
}


type StatusType = 'programada' | 'confirmada' | 'cancelada' | 'atendida' | 'ausente' | 'reprogramada';
interface StatusBadgeProps { status: StatusType }
export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<StatusType, { label: string; bg: string; color: string }> = {
    programada: { label: 'Programada', bg: '#E6F8FB', color: '#0BC5DF' },
    confirmada: { label: 'Confirmada', bg: '#ECFDF5', color: '#1D9E75' },
    cancelada: { label: 'Cancelada', bg: '#FEF2F2', color: '#E24B4A' },
    atendida: { label: 'Atendida', bg: '#F1F3F4', color: '#5F656A' },
    ausente: { label: 'Ausente', bg: '#FFFBEB', color: '#EF9F27' },
    reprogramada: { label: 'Reprogramada', bg: '#F5F3FF', color: '#7C3AED' },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary', size = 'md', fullWidth, loading, children, disabled, style, ...props
}: ButtonProps) {
  const variantStyles = {
    primary: { background: '#0BC5DF', color: '#fff', border: '1px solid #0BC5DF' },
    secondary: { background: '#fff', color: '#203F49', border: '1px solid #D3D7DA' },
    ghost: { background: 'transparent', color: '#0BC5DF', border: '1px solid transparent' },
    danger: { background: '#E24B4A', color: '#fff', border: '1px solid #E24B4A' },
  };
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: 12, borderRadius: 6 },
    md: { padding: '9px 18px', fontSize: 14, borderRadius: 8 },
    lg: { padding: '12px 24px', fontSize: 15, borderRadius: 8 },
  };
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        fontWeight: 500, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'all 0.15s ease', outline: 'none',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span style={{
          width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', display: 'inline-block',
        }} />
      ) : null}
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  badge?: 'required' | 'optional' | 'conditional';
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({ label, badge, error, hint, icon, rightElement, disabled, style, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? '#E24B4A' : focused ? '#0BC5DF' : '#D3D7DA';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>}
          {badge && <FieldBadge type={badge} />}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: `1px solid ${borderColor}`,
        borderRadius: 8, background: disabled ? '#F1F3F4' : '#fff',
        padding: '0 12px', transition: 'border-color 0.15s',
        boxShadow: focused ? `0 0 0 3px rgba(11,197,223,0.12)` : 'none',
      }}>
        {icon && <span style={{ color: '#888F94', flexShrink: 0, display: 'flex' }}>{icon}</span>}
        <input
          disabled={disabled}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 14, color: '#203F49', padding: '10px 0',
            cursor: disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          {...props}
        />
        {rightElement}
      </div>
      {error && <span style={{ fontSize: 11, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 4 }}>
        <AlertCircle size={11} />{error}
      </span>}
      {hint && !error && <span style={{ fontSize: 11, color: '#888F94' }}>{hint}</span>}
    </div>
  );
}

// ─── Password Input ───────────────────────────────────────────────────────────

export function PasswordInput(props: Omit<InputProps, 'type' | 'rightElement'>) {
  const [show, setShow] = React.useState(false);
  return (
    <Input
      {...props}
      type={show ? 'text' : 'password'}
      rightElement={
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#888F94', display: 'flex' }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose?: () => void;
}

export function Alert({ variant, message, onClose }: AlertProps) {
  const map = {
    info: { bg: '#E6F8FB', color: '#0899B0', border: '#0BC5DF', Icon: Info },
    success: { bg: '#ECFDF5', color: '#1D9E75', border: '#1D9E75', Icon: CheckCircle },
    warning: { bg: '#FFFBEB', color: '#EF9F27', border: '#EF9F27', Icon: AlertTriangle },
    error: { bg: '#FEF2F2', color: '#E24B4A', border: '#E24B4A', Icon: AlertCircle },
  };
  const s = map[variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 8, padding: '10px 14px',
    }}>
      <s.Icon size={15} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: s.color, flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: '#FFFFFF', border: '0.5px solid #D3D7DA',
      borderRadius: 12, padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section Block ─────────────────────────────────────────────────────────────

interface SectionBlockProps { title?: string; children: React.ReactNode; style?: React.CSSProperties; }
export function SectionBlock({ title, children, style }: SectionBlockProps) {
  return (
    <div style={{ background: '#F1F3F4', borderRadius: 8, padding: 16, ...style }}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#888F94',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
        }}>{title}</div>
      )}
      {children}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps {
  label?: string;
  badge?: 'required' | 'optional' | 'conditional';
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function Select({ label, badge, options, value, onChange, placeholder, disabled, error }: SelectProps) {
  const [focused, setFocused] = React.useState(false);
  const hasEmptyOption = options.some((option) => option.value === '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>}
          {badge && <FieldBadge type={badge} />}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', appearance: 'none', border: `1px solid ${error ? '#E24B4A' : focused ? '#0BC5DF' : '#D3D7DA'}`,
            borderRadius: 8, padding: '10px 36px 10px 12px',
            fontSize: 14, color: value ? '#203F49' : '#888F94',
            background: disabled ? '#F1F3F4' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
          }}
        >
          {placeholder && !hasEmptyOption && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#888F94', pointerEvents: 'none' }} />
      </div>
      {error && <span style={{ fontSize: 11, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{error}</span>}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; }
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? '#0BC5DF' : '#D3D7DA',
          position: 'relative', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: '#203F49' }}>{label}</span>}
    </label>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps { initials: string; size?: number; color?: string; }
export function Avatar({ initials, size = 36, color = '#0BC5DF' }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}
