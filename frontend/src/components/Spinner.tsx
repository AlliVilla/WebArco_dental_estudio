import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 24, 
  color = 'var(--primary)' 
}) => {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      border: '3px solid var(--border-color)',
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spinSlow 1s linear infinite'
    }} />
  );
};
export default Spinner;
