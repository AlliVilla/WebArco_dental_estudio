import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

import { Button, useTheme } from '../../../context';

export interface FirmaCanvasProps {
  label: string;
  subtitle: string;
  onCapture: (signatureData: string) => void;
  isSigned?: boolean;
  disabled?: boolean;
}

const CANVAS_BACKGROUND = '#FFFFFF';
const SIGNATURE_STROKE = '#203F49';

export function FirmaCanvas({
  label,
  subtitle,
  onCapture,
  isSigned = false,
  disabled = false,
}: FirmaCanvasProps) {
  useTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeColorRef = useRef(SIGNATURE_STROKE);
  const [isDrawing, setIsDrawing] = useState(false);

  const fillCanvasBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = CANVAS_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  useEffect(() => {
    strokeColorRef.current = SIGNATURE_STROKE;
    fillCanvasBackground();
  }, []);

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
    ctx.strokeStyle = strokeColorRef.current;
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillCanvasBackground();
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const exportContext = exportCanvas.getContext('2d');
    if (!exportContext) return;

    exportContext.fillStyle = CANVAS_BACKGROUND;
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(canvas, 0, 0);

    const signatureData = exportCanvas.toDataURL('image/png');
    onCapture(signatureData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
          {label}
        </label>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>{subtitle}</p>
      </div>

      {/* Canvas area */}
      <div
        style={{
          border: isSigned ? '2px solid var(--arco-success)' : '2px dashed var(--border)',
          borderRadius: 8,
          padding: 8,
          backgroundColor: 'var(--card)',
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
            backgroundColor: CANVAS_BACKGROUND,
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
          <div style={{ fontSize: 13, color: 'var(--arco-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={14} />
            Firma capturada
          </div>
        )}
      </div>
    </div>
  );
}
