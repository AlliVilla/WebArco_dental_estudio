import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  History,
  Edit,
  Trash2,
  Check,
  ArrowLeft,
  List,
} from "lucide-react";
import {
  Button,
  Select,
  Alert,
  Card,
  SectionBlock,
  FieldBadge,
  StatusBadge,
} from "../../../context";
import { Spinner } from "../../../components";
import { useNavigate, useParams } from "react-router-dom";
import { appointmentService } from "../services/appointmentService";
import type { Appointment, StatusChange as StatusChangeType } from "../types";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { formatFullDate, formatTimestamp, getEndTime } from "../utils";
import { STATUS_OPTIONS } from "../constants";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { Z } from "../../../utils/zIndex";

export function AppointmentDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const { isMobile } = useResponsive();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusChangeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [apptRes, histRes] = await Promise.all([
          appointmentService.getById(Number(id)),
          appointmentService.getStatusHistory(Number(id)),
        ]);

        if (cancelled) return;

        if (apptRes.success && apptRes.data) {
          setAppointment(apptRes.data);
          setNewStatus(apptRes.data.estado);
        } else {
          setError(apptRes.message || "Error al cargar la cita");
        }

        if (histRes.success) {
          setStatusHistory(histRes.data);
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Error al cargar la cita"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Alert variant="error" message={error} />
        <Button
          variant="ghost"
          onClick={() => navigate("/agenda")}
          style={{ marginTop: 16 }}
        >
          <ArrowLeft size={16} /> Volver a Agenda
        </Button>
      </div>
    );
  }

  if (!appointment) return null;

  const hasStatusChanged = newStatus !== appointment.estado;

  const clearMessages = () => {
    setSuccessMessage("");
    setInfoMessage("");
  };

  const handleSaveStatusChange = async () => {
    if (!hasStatusChanged) return;

    if (newStatus === "cancelada" && !showCancelWarning) {
      setShowCancelWarning(true);
      return;
    }

    try {
      const res = await appointmentService.changeStatus(
        Number(id!),
        newStatus,
        currentUser?.id_usuario || appointment.id_usuario
      );
      if (res.success && res.data) {
        setAppointment(res.data);
        setNewStatus(res.data.estado);
        setSuccessMessage("Estado actualizado correctamente.");
        setInfoMessage(
          "El estado fue actualizado. El historial refleja el cambio con fecha y hora."
        );
        setShowCancelWarning(false);

        const histRes = await appointmentService.getStatusHistory(Number(id!));
        if (histRes.success) setStatusHistory(histRes.data);

        timerRef.current = setTimeout(clearMessages, 5000);
      } else {
        setError(res.message || "Error al actualizar el estado");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el estado"
      );
    }
  };

  const handleDelete = async () => {
    try {
      await appointmentService.delete(Number(id!));
      navigate("/agenda");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la cita"
      );
    }
  };

  const patientName =
    `${appointment.persona?.primer_nombre || ""} ${
      appointment.persona?.primer_apellido || ""
    }`.trim() || "Sin nombre";
  const doctorName = appointment.doctor
    ? `${appointment.doctor.persona.primer_nombre} ${appointment.doctor.persona.primer_apellido}`
    : "Doctor no asignado";

  const startDateObj = new Date(appointment.fecha_inicio);
  const startTime = startDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  let endTime = '';
  if (appointment.fecha_fin) {
    endTime = new Date(appointment.fecha_fin).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else {
    endTime = new Date(startDateObj.getTime() + 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agenda")}>
          <ArrowLeft size={16} />
          Volver a Agenda
        </Button>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={clearMessages}
        />
      )}
      {infoMessage && (
        <Alert variant="info" message={infoMessage} onClose={clearMessages} />
      )}
      {error && (
        <Alert variant="error" message={error} onClose={() => setError("")} />
      )}
      {showCancelWarning && (
        <Alert
          variant="warning"
          message="¿Estás seguro de marcar esta cita como Cancelada? Esta acción quedará registrada."
        />
      )}

      <Card>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Calendar size={20} style={{ color: "#0BC5DF" }} />
            <h3 style={{ margin: 0, color: "#203F49" }}>Detalle de Cita</h3>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              width: isMobile ? "100%" : undefined,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/agenda/${id}/history`)}
              style={{ width: isMobile ? "100%" : undefined }}
            >
              <List size={14} />
              Ver historial del paciente
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/agenda/${id}/edit`)}
              style={{ width: isMobile ? "100%" : undefined }}
            >
              <Edit size={14} />
              Editar cita
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ width: isMobile ? "100%" : undefined }}
            >
              <Trash2 size={14} />
              Eliminar
            </Button>
          </div>
        </div>

        <SectionBlock
          title="Información de la cita"
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Paciente
                  </label>
                  <FieldBadge type="required" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <User size={15} style={{ color: "#888F94", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#203F49",
                      }}
                    >
                      {patientName}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#888F94", marginTop: 2 }}
                    >
                      Tel: {appointment.persona?.telefono || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Doctor asignado
                  </label>
                  <FieldBadge type="required" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <User size={15} style={{ color: "#888F94", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#203F49" }}>
                    {doctorName}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Fecha
                  </label>
                  <FieldBadge type="required" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <Calendar
                    size={15}
                    style={{ color: "#888F94", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14, color: "#203F49" }}>
                    {formatFullDate(appointment.fecha_inicio.split("T")[0])}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Hora
                  </label>
                  <FieldBadge type="required" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <Clock
                    size={15}
                    style={{ color: "#888F94", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14, color: "#203F49" }}>
                    {startTime} - {endTime}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Tipo de cita
                  </label>
                  <FieldBadge type="required" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <FileText
                    size={15}
                    style={{ color: "#888F94", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14, color: "#203F49" }}>
                    {appointment.tipo_cita || "General"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Estado actual
                  </label>
                  <FieldBadge type="required" />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <StatusBadge status={appointment.estado} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Motivo / Tratamiento
                </label>
                <FieldBadge type="required" />
              </div>
              <div
                style={{
                  border: "1px solid #D3D7DA",
                  borderRadius: 8,
                  background: "#F8F9FA",
                  padding: "10px 12px",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: "#203F49",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {appointment.motivo || "No especificado"}
                </span>
              </div>
            </div>

            {appointment.notas && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Notas adicionales
                  </label>
                  <FieldBadge type="optional" />
                </div>
                <div
                  style={{
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    background: "#F8F9FA",
                    padding: "10px 12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "#888F94",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {appointment.notas}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SectionBlock>

        <SectionBlock title="Cambiar estado" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Select
              label="Selector para cambiar estado"
              badge="required"
              options={STATUS_OPTIONS}
              value={newStatus}
              onChange={(v) => {
                setNewStatus(v.toString());
                setShowCancelWarning(false);
              }}
            />

            {hasStatusChanged && (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #EF9F27",
                  borderRadius: 8,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <History
                  size={15}
                  style={{ color: "#EF9F27", flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: "#EF9F27" }}>
                  Cambio pendiente: <strong>{appointment.estado}</strong> →{" "}
                  <strong>{newStatus}</strong>
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
              }}
            >
              <Button
                variant="primary"
                onClick={handleSaveStatusChange}
                disabled={!hasStatusChanged}
                style={{ width: isMobile ? "100%" : undefined }}
              >
                <Check size={16} />
                Guardar cambio de estado
              </Button>
              {showCancelWarning && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewStatus(appointment.estado);
                    setShowCancelWarning(false);
                  }}
                  style={{ width: isMobile ? "100%" : undefined }}
                >
                  Cancelar cambio
                </Button>
              )}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock title="Historial de cambios de estado">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
              Historial de cambios
            </label>
            <FieldBadge type="optional" />
          </div>

          {statusHistory.length === 0 ? (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                color: "#888F94",
                fontSize: 13,
              }}
            >
              No hay cambios de estado registrados
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {statusHistory.map((change, idx) => (
                <div
                  key={change.id_historial || idx}
                  style={{
                    background: "#fff",
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#E6F8FB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <History size={14} style={{ color: "#0BC5DF" }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#203F49",
                        marginBottom: 4,
                      }}
                    >
                      {change.estado_anterior ? (
                        <>
                          Estado cambiado de{" "}
                          <StatusBadge status={change.estado_anterior} /> a{" "}
                          <StatusBadge status={change.estado_nuevo} />
                        </>
                      ) : (
                        <>
                          Cita creada con estado{" "}
                          <StatusBadge status={change.estado_nuevo} />
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#888F94" }}>
                      {formatTimestamp(change.fecha_cambio)} · Por{" "}
                      {change.usuario?.persona?.primer_nombre ||
                        `Usuario ${change.cambiado_por}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>
      </Card>

      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
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
              maxWidth: isMobile ? "100%" : 450,
              width: isMobile ? "100%" : "90%",
              maxHeight: isMobile ? "85vh" : undefined,
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 8,
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
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} style={{ color: "#E24B4A" }} />
              </div>
              <h3 style={{ margin: 0, color: "#203F49" }}>Eliminar Cita</h3>
            </div>

            <p
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 14,
                color: "#5F656A",
                lineHeight: 1.5,
              }}
            >
              ¿Estás seguro de que deseas eliminar esta cita? Esta acción no se
              puede deshacer. Se eliminará permanentemente la cita de{" "}
              <strong>{patientName}</strong> programada para el{" "}
              {formatFullDate(appointment.fecha_inicio.split("T")[0])} a las{" "}
              {startTime}.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
              }}
            >
              <Button variant="danger" fullWidth onClick={handleDelete}>
                <Trash2 size={16} />
                Eliminar cita
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
