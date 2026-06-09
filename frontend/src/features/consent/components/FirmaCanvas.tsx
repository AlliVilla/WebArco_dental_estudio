import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../context';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

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
    ctx.strokeStyle = '#203F49';
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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        <label style={{ fontSize: 13, fontWeight: 600, color: '#203F49', display: 'block', marginBottom: 4 }}>
          {label}
        </label>
        <p style={{ fontSize: 12, color: '#888F94', margin: 0 }}>{subtitle}</p>
      </div>

      {/* Canvas area */}
      <div
        style={{
          border: isSigned ? '2px solid #1D9E75' : '2px dashed #D3D7DA',
          borderRadius: 8,
          padding: 8,
          backgroundColor: '#fff',
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
            backgroundColor: '#ffffff',
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
              <X size={14} />
              Limpiar
            </Button>
            <Button variant="primary" size="sm" onClick={handleCapture}>
              Guardar Firma
            </Button>
          </>
        )}
        {isSigned && (
          <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            ✓ Firma capturada
          </div>
        )}
      </div>
    </div>
  );
}

export default FirmaCanvas;
