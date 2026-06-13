import { X } from "lucide-react";
import { useResponsive } from "../hooks/useWindowWidth";
import { Z } from "../utils/zIndex";

export interface StatsDrawerProps {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function StatsDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: StatsDrawerProps) {
  const { isMobile, width: w } = useResponsive();

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "85vh",
        background: "#fff",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
        zIndex: Z.DRAWER,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
      }
    : {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: Math.min(w - 32, 420),
        background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        zIndex: Z.DRAWER,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
      };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: Z.OVERLAY,
          }}
        />
      )}
      <div style={panelStyle}>
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 4px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 9999,
                background: "#D3D7DA",
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: isMobile ? "12px 20px 16px" : "20px 24px",
            borderBottom: "1px solid #D3D7DA",
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#203F49",
                margin: 0,
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: 13, color: "#888F94", margin: "4px 0 0" }}>
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#888F94",
              display: "flex",
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {children}
        </div>
      </div>
    </>
  );
}
