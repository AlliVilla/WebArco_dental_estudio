import { useState } from 'react';
import { Check } from 'lucide-react';
import { FieldBadge } from '../../../context';

type BadgeType = 'required' | 'optional' | 'conditional';

export function Textarea({
  badge,
  disabled,
  hint,
  label,
  onChange,
  placeholder,
  rows = 3,
  value,
}: {
  badge?: BadgeType;
  disabled?: boolean;
  hint?: string;
  label?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label || badge ? (
        <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
          {label ? (
            <label style={{ color: 'var(--foreground, #203F49)', fontSize: 13, fontWeight: 500 }}>
              {label}
            </label>
          ) : null}
          {badge ? <FieldBadge type={badge} /> : null}
        </div>
      ) : null}
      <textarea
        disabled={disabled}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange?.(event.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        rows={rows}
        value={value}
        style={{
          background: disabled ? 'var(--secondary, #F1F3F4)' : 'var(--card, #FFFFFF)',
          border: `1px solid ${focused ? 'var(--arco-primary, #0BC5DF)' : 'var(--border, #D3D7DA)'}`,
          borderRadius: 8,
          boxShadow: focused ? '0 0 0 3px rgba(11,197,223,0.12)' : 'none',
          color: 'var(--foreground, #203F49)',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          minHeight: rows * 38,
          outline: 'none',
          padding: '10px 12px',
          resize: 'vertical',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          width: '100%',
        }}
      />
      {hint ? <span style={{ color: 'var(--muted-foreground, #888F94)', fontSize: 11 }}>{hint}</span> : null}
    </div>
  );
}

export function CheckboxGroup({
  badge,
  label,
  onChange,
  options,
  selected,
}: {
  badge?: BadgeType;
  label?: string;
  onChange: (ids: string[]) => void;
  options: { id: string; label: string }[];
  selected: string[];
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label || badge ? (
        <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
          {label ? (
            <label style={{ color: 'var(--foreground, #203F49)', fontSize: 13, fontWeight: 500 }}>
              {label}
            </label>
          ) : null}
          {badge ? <FieldBadge type={badge} /> : null}
        </div>
      ) : null}
      <div
        style={{
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--border, #D3D7DA)',
          borderRadius: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 24px',
          padding: '10px 14px',
        }}
      >
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <div
              key={option.id}
              onClick={() => toggle(option.id)}
              style={{
                alignItems: 'center',
                cursor: 'pointer',
                display: 'flex',
                gap: 7,
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  alignItems: 'center',
                  background: checked ? 'var(--arco-primary, #0BC5DF)' : 'var(--card, #FFFFFF)',
                  border: `2px solid ${checked ? 'var(--arco-primary, #0BC5DF)' : 'var(--border, #D3D7DA)'}`,
                  borderRadius: 4,
                  display: 'flex',
                  flexShrink: 0,
                  height: 16,
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  width: 16,
                }}
              >
                {checked ? <Check color="#FFFFFF" size={11} strokeWidth={3} /> : null}
              </span>
              <span style={{ color: 'var(--foreground, #203F49)', fontSize: 13 }}>{option.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RadioGroup({
  badge,
  label,
  onChange,
  options,
  value,
}: {
  badge?: BadgeType;
  label?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label || badge ? (
        <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
          {label ? (
            <label style={{ color: 'var(--foreground, #203F49)', fontSize: 13, fontWeight: 500 }}>
              {label}
            </label>
          ) : null}
          {badge ? <FieldBadge type={badge} /> : null}
        </div>
      ) : null}
      <div
        style={{
          background: 'var(--card, #FFFFFF)',
          border: '1px solid var(--border, #D3D7DA)',
          borderRadius: 8,
          display: 'flex',
          gap: 16,
          padding: '10px 14px',
        }}
      >
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <div
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                alignItems: 'center',
                cursor: 'pointer',
                display: 'flex',
                gap: 7,
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  alignItems: 'center',
                  background: 'var(--card, #FFFFFF)',
                  border: `2px solid ${checked ? 'var(--arco-primary, #0BC5DF)' : 'var(--border, #D3D7DA)'}`,
                  borderRadius: '50%',
                  display: 'flex',
                  flexShrink: 0,
                  height: 16,
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  width: 16,
                }}
              >
                {checked ? (
                  <span
                    style={{
                      background: 'var(--arco-primary, #0BC5DF)',
                      borderRadius: '50%',
                      height: 8,
                      width: 8,
                    }}
                  />
                ) : null}
              </span>
              <span style={{ color: 'var(--foreground, #203F49)', fontSize: 13 }}>{option.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
