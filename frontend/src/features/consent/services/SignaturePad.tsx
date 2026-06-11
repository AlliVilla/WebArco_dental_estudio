import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, PenLine, RotateCcw } from "lucide-react";
import { Button } from "../../../context";

interface SignaturePadProps {
  title: string;
  signerName: string;
  value?: string;
  onChange: (signature: string) => void;
}

export function SignaturePad({ title, signerName, value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const [hasDrawing, setHasDrawing] = useState(Boolean(value));
  const [isPadFocused, setIsPadFocused] = useState(false);

  const signaturePadBorderColor = isPadFocused ? "#0BC5DF" : "#D3D7DA";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.scale(ratio, ratio);
      context.lineCap = "round";
      context.lineJoin = "round";

      const textColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim();

      context.strokeStyle = textColor || "#0F172A";
      context.lineWidth = 2;
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();

    context.clearRect(0, 0, rect.width, rect.height);
    setHasDrawing(Boolean(value));

    if (!value?.startsWith("data:image")) return;

    const image = new Image();

    image.onload = () => {
      context.clearRect(0, 0, rect.width, rect.height);
      context.drawImage(image, 0, 0, rect.width, rect.height);
    };

    image.src = value;
  }, [value, title, signerName]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    canvas.setPointerCapture(event.pointerId);
    canvas.focus();

    setIsPadFocused(true);

    const point = getPoint(event);

    drawingRef.current = true;

    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;

    const context = canvasRef.current?.getContext("2d");

    if (!context) return;

    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();

    setHasDrawing(true);
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;

    drawingRef.current = false;

    const canvas = canvasRef.current;

    if (!canvas) return;

    onChange(canvas.toDataURL("image/png"));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    setHasDrawing(false);
    onChange("");
  };

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--arco-primary-light)",
          padding: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "var(--arco-primary)",
              color: "var(--primary-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PenLine size={18} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "var(--foreground)", fontSize: 16, fontWeight: 600 }}>
              {title}
            </div>

            <div style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
              {signerName}
            </div>
          </div>
        </div>

        <Button variant="secondary" size="sm" type="button" onClick={handleClear}>
          <RotateCcw size={16} />
          Limpiar pizarra
        </Button>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            border: `1px solid ${signaturePadBorderColor}`,
            borderRadius: 12,
            background: "var(--input-background)",
            padding: 10,
            transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            boxShadow: isPadFocused ? "0 0 0 3px rgba(11, 197, 223, 0.12)" : "none",
          }}
        >
          <canvas
            ref={canvasRef}
            tabIndex={0}
            onFocus={() => setIsPadFocused(true)}
            onBlur={() => setIsPadFocused(false)}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
            style={{
              width: "100%",
              height: 220,
              border: `1px solid ${signaturePadBorderColor}`,
              borderRadius: 10,
              background: "var(--card)",
              cursor: "crosshair",
              touchAction: "none",
              display: "block",
              outline: "none",
              transition: "border-color 0.18s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--background)",
              padding: "10px 12px",
              color: "var(--muted-foreground)",
              fontSize: 12,
              lineHeight: "18px",
            }}
          >
            Firma con mouse, touchpad o pantalla táctil. La pizarra se limpia automáticamente al
            pasar al siguiente firmante.
          </div>

          <div
            style={{
              border: `1px solid ${hasDrawing ? "var(--arco-success)" : "var(--arco-warning)"}`,
              borderRadius: 10,
              background: hasDrawing ? "var(--arco-success-soft)" : "var(--arco-warning-soft)",
              color: hasDrawing ? "var(--arco-success)" : "var(--arco-warning)",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 14px",
            }}
          >
            {hasDrawing ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            {hasDrawing ? "Firma capturada y lista para guardar" : "Pendiente de firma"}
          </div>
        </div>
      </div>
    </div>
  );
}