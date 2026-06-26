import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "../../../context";
import type { Appointment } from "../types";
import { STATUS_STYLES } from "../constants";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { Z } from "../../../utils/zIndex";
import { appointmentService } from "../services/appointmentService";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export interface AppointmentQuickViewProps {
  appointment: Appointment;
  onClose: () => void;
  onStatusChange?: (updated: Appointment) => void;
}

export function AppointmentQuickView({
  appointment,
  onClose,
  onStatusChange,
}: AppointmentQuickViewProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const currentUser = useAuthStore((s) => s.user);
  const [loadingAttend, setLoadingAttend] = useState(false);

  const canMarkAttended = ["programada", "confirmada"].includes(
    appointment.estado
  );

  const handleMarkAttended = async () => {
    setLoadingAttend(true);
    try {
      const res = await appointmentService.changeStatus(
        appointment.id_cita,
        "atendida",
        currentUser?.id_usuario || appointment.id_usuario
      );
      if (res.success && res.data) {
        onStatusChange?.(res.data);
        onClose();
      }
    } catch {
      // silent
    } finally {
      setLoadingAttend(false);
    }
  };

  const handleDetail = () => {
    navigate(`/agenda/${appointment.id_cita}`);
    onClose();
  };

  const statusStyle = STATUS_STYLES[appointment.estado];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: Z.MODAL_OVERLAY,
        padding: isMobile ? 0 : 20,
        overscrollBehavior: "contain",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? "16px 16px 0 0" : 12,
          padding: isMobile ? "12px 20px 24px" : 24,
          maxWidth: isMobile ? "100%" : 420,
          width: isMobile ? "100%" : "90%",
          maxHeight: isMobile ? "85vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 4,
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
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#203F49",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Detalle de Cita
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #D3D7DA",
              borderRadius: 6,
              cursor: "pointer",
              color: "#5F656A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span
              style={{
                fontSize: 13,
                color: "#888F94",
                display: "block",
                marginBottom: 4,
              }}
            >
              Paciente
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#203F49" }}>
              {appointment.persona?.primer_nombre}{" "}
              {appointment.persona?.primer_apellido}
            </span>
          </div>

          <div>
            <span
              style={{
                fontSize: 13,
                color: "#888F94",
                display: "block",
                marginBottom: 4,
              }}
            >
              Doctor
            </span>
            <span style={{ fontSize: 15, color: "#203F49" }}>
              {appointment.doctor?.persona?.primer_nombre
                ? `${appointment.doctor.persona.sexo === "F"
                  ? "Dra." : "Dr." } ${appointment.doctor.persona.primer_nombre} ${appointment.doctor.persona.primer_apellido}`
                : "Doctor no asignado"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 13,
                  color: "#888F94",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Fecha
              </span>
              <span style={{ fontSize: 15, color: "#203F49" }}>
                {new Date(appointment.fecha_inicio).toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: 13,
                  color: "#888F94",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Hora
              </span>
              <span style={{ fontSize: 15, color: "#203F49" }}>
                {new Date(appointment.fecha_inicio).toLocaleTimeString(
                  "en-US",
                  { hour: "numeric", minute: "2-digit", hour12: true }
                )}
                {appointment.fecha_fin
                  ? ` (${Math.max(
                      1,
                      Math.round(
                        (new Date(appointment.fecha_fin).getTime() -
                          new Date(appointment.fecha_inicio).getTime()) /
                          3600000
                      )
                    )}h)`
                  : " (1h)"}
              </span>
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: 13,
                color: "#888F94",
                display: "block",
                marginBottom: 4,
              }}
            >
              Tratamiento
            </span>
            <span
              style={{
                fontSize: 15,
                color: "#203F49",
                wordBreak: "break-word",
              }}
            >
              {appointment.motivo || appointment.tipo_cita || "General"}
            </span>
          </div>

          <div>
            <span
              style={{
                fontSize: 13,
                color: "#888F94",
                display: "block",
                marginBottom: 4,
              }}
            >
              Estado
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                background: statusStyle?.bg || "#E6F8FB",
                color: statusStyle?.text || "#0BC5DF",
                display: "inline-block",
              }}
            >
              {statusStyle?.label || appointment.estado}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
          }}
        >
          {canMarkAttended && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleMarkAttended}
              disabled={loadingAttend}
              style={{ padding: "12px 0", fontSize: 15, fontWeight: 500 }}
            >
              {loadingAttend ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Check size={18} />
              )}
              {loadingAttend ? "Actualizando…" : "Marcar como atendida"}
            </Button>
          )}
          <Button
            variant={canMarkAttended ? "secondary" : "primary"}
            fullWidth
            onClick={handleDetail}
            style={{ padding: "12px 0", fontSize: 15, fontWeight: 500 }}
          >
            Ver detalle completo
          </Button>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                navigate(`/agenda/${appointment.id_cita}/history`);
                onClose();
              }}
              style={{ color: "#0BC5DF", fontWeight: 500 }}
            >
              Historial del paciente
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
              style={{ border: "1px solid #D3D7DA", fontWeight: 500 }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
