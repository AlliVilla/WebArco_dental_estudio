import { Bell, ChevronRight, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNotificationStore } from "../features/notifications/hooks/useNotifications";
import { NotificationPanel } from "../features/notifications/components/NotificationPanel";
import { NotificationToast, BellBadge } from "../features/notifications/components/NotificationToast";

interface TopBarProps {
  title: string;
  breadcrumbs: string[];
  sidebarWidth?: number;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function TopBar({
  title,
  breadcrumbs,
  sidebarWidth = 240,
  onMenuClick,
  showMenuButton = false,
}: TopBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const { unreadCount, latestNew, clearToast, startPolling } = useNotificationStore();

  // Iniciar polling al montar TopBar (único lugar en el layout)
  useEffect(() => {
    const stopPolling = startPolling();
    return stopPolling;
  }, []);

  // Auto-clear toast after 4.5s
  useEffect(() => {
    if (latestNew) {
      const t = setTimeout(() => clearToast(), 4500);
      return () => clearTimeout(t);
    }
  }, [latestNew]);

  return (
    <header
      style={{
        height: 60,
        background: "#FFFFFF",
        borderBottom: "0.5px solid #D3D7DA",
        display: "flex",
        alignItems: "center",
        padding: showMenuButton ? "0 12px" : "0 16px",
        gap: showMenuButton ? 8 : 12,
        position: "fixed",
        top: 0,
        left: sidebarWidth,
        right: 0,
        zIndex: 40,
        transition: "left 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Botón hamburger — solo en móvil */}
      {showMenuButton && (
        <button
          onClick={onMenuClick}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: 8,
            color: "#203F49",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Title + Breadcrumb */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            fontSize: showMenuButton ? 16 : 18,
            fontWeight: 600,
            color: "#203F49",
            margin: 0,
            lineHeight: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h2>
        {!showMenuButton && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
            }}
          >
            {breadcrumbs.map((crumb, i) => (
              <span
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                {i > 0 && (
                  <ChevronRight size={11} style={{ color: "#888F94" }} />
                )}
                <span
                  style={{
                    fontSize: 11,
                    color:
                      i === breadcrumbs.length - 1 ? "#888F94" : "#0BC5DF",
                    cursor:
                      i < breadcrumbs.length - 1 ? "pointer" : "default",
                  }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notifications bell + panel */}
      <div
        ref={bellRef}
        style={{ position: "relative", flexShrink: 0 }}
      >
        {/* Toast animado */}
        {latestNew && (
          <NotificationToast
            notification={latestNew}
            onClose={clearToast}
          />
        )}

        {/* Botón campanita */}
        <button
          id="notification-bell-btn"
          onClick={() => setPanelOpen((v) => !v)}
          style={{
            position: "relative",
            background: panelOpen ? "#E6F8FB" : "none",
            border: panelOpen ? "1.5px solid #0BC5DF" : "none",
            cursor: "pointer",
            padding: 8,
            borderRadius: 8,
            color: panelOpen ? "#0BC5DF" : "#5F656A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          aria-label="Notificaciones"
          aria-expanded={panelOpen}
        >
          <Bell size={18} />
          <BellBadge count={unreadCount} />
        </button>

        {/* Panel dropdown */}
        {panelOpen && (
          <NotificationPanel onClose={() => setPanelOpen(false)} />
        )}
      </div>
    </header>
  );
}
