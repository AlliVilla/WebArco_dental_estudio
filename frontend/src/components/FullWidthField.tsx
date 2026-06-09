import React from 'react';

interface FullWidthFieldProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function FullWidthField({ children, style }: FullWidthFieldProps) {
  return (
    <div
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
export default FullWidthField;
