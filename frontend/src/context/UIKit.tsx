import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown, AlertCircle, CheckCircle, Info, AlertTriangle, Plus, X } from 'lucide-react';

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
    atendida: { label: 'Atendida', bg: '#F1F3F4', color: '#203F49' },
    ausente: { label: 'Ausente', bg: '#FFFBEB', color: '#EF9F27' },
    reprogramada: { label: 'Reprogramada', bg: '#EFF6FF', color: '#3B82F6' },
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
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownAbove, setDropdownAbove] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(200);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const above = spaceAbove > spaceBelow;
      setDropdownAbove(above);
      setDropdownMaxHeight(Math.min(200, above ? spaceAbove : spaceBelow));
      const idx = options.findIndex((o) => o.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveIndex(-1);
    }
  }, [open, options, value]);

  useEffect(() => {
    if (open && activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          onChange?.(options[activeIndex].value);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }} ref={ref}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>}
          {badge && <FieldBadge type={badge} />}
        </div>
      )}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid ${error ? '#E24B4A' : open ? '#0BC5DF' : '#D3D7DA'}`,
          borderRadius: 8, padding: '10px 36px 10px 12px',
          fontSize: 14, color: value ? '#203F49' : '#888F94',
          background: disabled ? '#F1F3F4' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none',
          boxShadow: open ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
          position: 'relative',
        }}
      >
        {selected ? selected.label : placeholder || 'Seleccionar...'}
        <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#888F94', pointerEvents: 'none' }} />
      </div>
      {open && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            left: 0, right: 0, zIndex: 1000,
            [dropdownAbove ? 'bottom' : 'top']: '100%',
            [dropdownAbove ? 'marginBottom' : 'marginTop']: 4,
            background: '#fff', border: '1px solid #D3D7DA',
            borderRadius: dropdownAbove ? '8px 8px 0 0' : '0 0 8px 8px',
            maxHeight: dropdownMaxHeight, overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onChange?.(o.value); setOpen(false); }}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: '10px 12px', fontSize: 14, color: '#203F49',
                cursor: 'pointer', borderBottom: i < options.length - 1 ? '1px solid #F1F3F4' : 'none',
                background: o.value === value ? 'rgba(11,197,223,0.08)' : activeIndex === i ? '#F8F9FA' : 'transparent',
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
      {error && <span style={{ fontSize: 11, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{error}</span>}
    </div>
  );
}

// ─── Combobox ─────────────────────────────────────────────────────────────────

interface ComboboxProps {
  label?: string;
  badge?: 'required' | 'optional' | 'conditional';
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onCreateNew?: boolean;
}

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function Combobox({ label, badge, options, value, onChange, placeholder, disabled, error }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const plainValue = stripAccents(value.toLowerCase());

  const filtered = value
    ? options.filter((o) => stripAccents(o.label.toLowerCase()).includes(plainValue))
    : options;

  const isExactMatch = options.some(
    (o) => stripAccents(o.label.toLowerCase()) === plainValue.trim(),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        listRef.current && !listRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>}
          {badge && <FieldBadge type={badge} />}
        </div>
      )}
      <div ref={inputRef} style={{ position: 'relative' }}>
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => { setFocused(true); setIsOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%',
            border: `1px solid ${error ? '#E24B4A' : focused ? '#0BC5DF' : '#D3D7DA'}`,
            borderRadius: 8,
            padding: '10px 36px 10px 12px',
            fontSize: 14,
            color: '#203F49',
            background: disabled ? '#F1F3F4' : '#fff',
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
            boxSizing: 'border-box',
          }}
        />
        <ChevronDown
          size={15}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#888F94', pointerEvents: 'none',
          }}
        />
      </div>
      {isOpen && !disabled && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
            background: '#fff', border: `1px solid #D3D7DA`, borderRadius: 8,
            marginTop: 4, maxHeight: 200, overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {filtered.length > 0 && filtered.map((o) => (
            <div
              key={o.value}
              onClick={() => { onChange(o.label); setIsOpen(false); }}
              style={{
                padding: '10px 12px', fontSize: 14, color: '#203F49',
                cursor: 'pointer', borderBottom: '1px solid #F1F3F4',
                background: o.label.toLowerCase() === value.toLowerCase()
                  ? 'rgba(11,197,223,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F9FA'; }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = o.label.toLowerCase() === value.toLowerCase()
                  ? 'rgba(11,197,223,0.08)' : 'transparent';
              }}
            >
              {o.label}
            </div>
          ))}
          {value.trim() && !isExactMatch && (
            <div
              onClick={() => { onChange(value.trim()); setIsOpen(false); }}
              style={{
                padding: '10px 12px', fontSize: 14, color: '#0BC5DF',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                borderTop: filtered.length > 0 ? '1px solid #F1F3F4' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F9FA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Plus size={14} />
              Crear "{value.trim()}"
            </div>
          )}
          {!value.trim() && filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: '#888F94' }}>
              Escriba un nombre para crear una nueva especialidad
            </div>
          )}
        </div>
      )}
      {error && (
        <span style={{ fontSize: 11, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} />{error}
        </span>
      )}
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

interface AvatarProps { initials: string; size?: number; color?: string; square?: boolean; }
export function Avatar({ initials, size = 36, color = '#0BC5DF', square = false }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: square ? 8 : '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── MultiCombobox ────────────────────────────────────────────────────────────

interface MultiComboboxProps {
  label?: string;
  badge?: 'required' | 'optional' | 'conditional';
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function MultiCombobox({ label, badge, options, values, onChange, placeholder, disabled, error }: MultiComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const plainValue = stripAccents(inputValue.toLowerCase());

  const filtered = inputValue
    ? options.filter((o) => stripAccents(o.label.toLowerCase()).includes(plainValue) && !values.includes(o.label))
    : options.filter((o) => !values.includes(o.label));

  const isExactMatch = options.some(
    (o) => stripAccents(o.label.toLowerCase()) === plainValue.trim(),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        listRef.current && !listRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (labelToAdd: string) => {
    if (!values.includes(labelToAdd)) {
      onChange([...values, labelToAdd]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemove = (labelToRemove: string) => {
    onChange(values.filter(v => v !== labelToRemove));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>}
          {badge && <FieldBadge type={badge} />}
        </div>
      )}
      <div 
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          border: `1px solid ${error ? '#E24B4A' : focused ? '#0BC5DF' : '#D3D7DA'}`,
          borderRadius: 8, padding: '6px 36px 6px 8px',
          background: disabled ? '#F1F3F4' : '#fff',
          minHeight: 40,
          boxShadow: focused ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
          boxSizing: 'border-box',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {values.map((v, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#E6F8FB', color: '#0899B0',
            padding: '2px 8px', borderRadius: 16, fontSize: 13, fontWeight: 500
          }}>
            {v}
            <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); handleRemove(v); }} />
          </span>
        ))}
        <input
          ref={inputRef}
          disabled={disabled}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => { setFocused(true); setIsOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={values.length === 0 ? placeholder : ''}
          style={{
            flex: 1, minWidth: 100, border: 'none', background: 'transparent',
            outline: 'none', fontSize: 14, color: '#203F49', padding: '4px 0',
          }}
          onKeyDown={(e) => {
             if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
                 handleRemove(values[values.length - 1]);
             }
             if (e.key === 'Enter' && inputValue.trim()) {
                 e.preventDefault();
                 const exact = filtered.find(f => stripAccents(f.label.toLowerCase()) === plainValue.trim());
                 handleSelect(exact ? exact.label : inputValue.trim());
             }
          }}
        />
        <ChevronDown
          size={15}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#888F94', pointerEvents: 'none',
          }}
        />
      </div>
      {isOpen && !disabled && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
            background: '#fff', border: `1px solid #D3D7DA`, borderRadius: 8,
            marginTop: 4, maxHeight: 200, overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {filtered.length > 0 && filtered.map((o) => (
            <div
              key={o.value}
              onClick={() => handleSelect(o.label)}
              style={{
                padding: '10px 12px', fontSize: 14, color: '#203F49',
                cursor: 'pointer', borderBottom: '1px solid #F1F3F4',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F9FA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
          {inputValue.trim() && !isExactMatch && !values.map(v=>stripAccents(v.toLowerCase())).includes(plainValue.trim()) && (
            <div
              onClick={() => handleSelect(inputValue.trim())}
              style={{
                padding: '10px 12px', fontSize: 14, color: '#0BC5DF',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                borderTop: filtered.length > 0 ? '1px solid #F1F3F4' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F9FA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Plus size={14} />
              Crear "{inputValue.trim()}"
            </div>
          )}
          {!inputValue.trim() && filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: '#888F94' }}>
              No hay más opciones disponibles
            </div>
          )}
        </div>
      )}
      {error && (
        <span style={{ fontSize: 11, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} />{error}
        </span>
      )}
    </div>
  );
}
