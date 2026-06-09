import React from 'react';

interface FormSectionProps {
  title?: string;
  icon?: React.ReactNode;
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function FormSection({ title, icon, columns = 2, children, style }: FormSectionProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface-elevated)', // elevated surface color
        borderRadius: 14, // as per style rules
        padding: 20,
        border: '1px solid var(--border-color)', // theme border
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 16, // títulos sección (16px)
            fontWeight: 600, // semibold
            color: 'var(--text-main)', // theme primary text color
            borderBottom: '1px solid var(--border-color)', // divider
            paddingBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {icon && <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <span>{title}</span>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 1 ? '1fr' : columns === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default FormSection;

