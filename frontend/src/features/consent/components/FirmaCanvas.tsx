import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button, useTheme } from '../../../context';

export interface FirmaCanvasProps {
  label: string;
  subtitle: string;
  onCapture: (signatureData: string) => void;
  isSigned?: boolean;
  disabled?: boolean;
}

export function FirmaCanvas({
  label,
  subtitle,
  onCapture,
  isSigned = false,
  disabled = false,
}: FirmaCanvasProps) {
  useTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || isSigned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || isSigned) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    // Leemos la variable del tema para que la "tinta" se adapte al modo oscuro/claro
    const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
    ctx.strokeStyle = strokeColor || '#203F49';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Se borra el contenido dejándolo transparente en lugar de forzar un color blanco
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onCapture(signatureData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: 4 }}>
          {label}
        </label>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground, var(--arco-gray-500))', margin: 0 }}>{subtitle}</p>
      </div>

      {/* Canvas area */}
      <div
        style={{
          border: isSigned ? '2px solid var(--arco-success)' : '2px dashed var(--border)',
          borderRadius: 8,
          padding: 8,
          backgroundColor: 'var(--background)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            backgroundColor: 'transparent',
            borderRadius: 4,
            cursor: disabled || isSigned ? 'not-allowed' : 'crosshair',
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!isSigned && !disabled && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={16} />
              Limpiar
            </Button>
            <Button variant="primary" size="sm" onClick={handleCapture}>
              Guardar Firma
            </Button>
          </>
        )}
        {isSigned && (
          <div style={{ fontSize: 12, color: 'var(--arco-success)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            ✓ Firma capturada
          </div>
        )}
      </div>
    </div>
  );
}