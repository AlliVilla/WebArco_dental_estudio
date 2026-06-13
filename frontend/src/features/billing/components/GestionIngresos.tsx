import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Card, Alert, Avatar } from "../../../context";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Plus,
  FileSpreadsheet,
  Printer,
  Eye,
  Trash2,
} from "lucide-react";
import { DataTable, ConfirmModal, Modal } from "../../../components";
import api from "../../../services/api";
import billingService from "../services/billingService";
import { consultaService } from "../../patients/services/consultaService";
import type { CreatePaymentInput, PatientPayment } from "../types";

interface IncomeRecord {
  id: string;
  idConsulta: number;
  fecha: string;
  paciente: string;
  tratamiento: string;
  monto: number;
  metodoPago: string;
  doctor: string;
  estado: string;
  observacion?: string;
}

const mapPaymentToIncomeRecord = (payment: PatientPayment): IncomeRecord => ({
  id: String(payment.id_pago),
  idConsulta: payment.id_consulta,
  fecha: payment.fecha,
  paciente: `${payment.consulta.persona.nombre} ${payment.consulta.persona.apellido}`.trim(),
  tratamiento: payment.consulta.tratamiento || payment.consulta.diagnostico || `Pago de consulta #${payment.id_consulta}`,
  monto: Number(payment.abono),
  metodoPago: payment.metodoPago,
  doctor: payment.consulta.doctor?.nombre || "—",
  estado: payment.estado,
  observacion: payment.observacion,
});

export function GestionIngresos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // View detail state
  const [detailRecord, setDetailRecord] = useState<IncomeRecord | null>(null);

  // Delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Form states
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  // Patient search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id_persona: number; primer_nombre: string; segundo_nombre: string | null; primer_apellido: string; segundo_apellido: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Selected patient and consulta
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; nombre: string } | null>(null);
  const [patientConsultas, setPatientConsultas] = useState<Array<{ id_consulta: number; diagnostico: string | null; tratamiento: string | null; fecha_inicio: string; doctor: string }>>([]);
  const [selectedConsultaId, setSelectedConsultaId] = useState("");
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(false);

  // Other form fields
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadPayments = async (p = page) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await billingService.getAll({ page: p, limit: 20 });
      const body = response.data!;
      setRecords(body.data.map(mapPaymentToIncomeRecord));
      setTotalPages(body.pagination.totalPages);
      setTotalRecords(body.pagination.total);
      setPage(body.pagination.page);
    } catch (error: any) {
      setErrorMessage(error?.message || "No se pudo cargar el historial de ingresos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments(1);
  }, []);

  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);
    const monthRecords = records.filter((r) => r.fecha?.startsWith(currentMonth));
    const todayRecords = records.filter((r) => r.fecha === today);
    const monthTotal = monthRecords.reduce((s, r) => s + r.monto, 0);
    const dayTotal = todayRecords.reduce((s, r) => s + r.monto, 0);
    return { monthTotal, dayTotal, average: monthRecords.length ? monthTotal / monthRecords.length : 0 };
  }, [records]);

  const formatCurrency = (v: number) =>
    `L ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

  const kpis = [
    { label: "Ingresos del Mes", value: formatCurrency(totals.monthTotal), icon: DollarSign, color: "#0BC5DF", bg: "#E6F8FB" },
    { label: "Pagos Registrados", value: String(totalRecords), icon: TrendingUp, color: "#EF9F27", bg: "#FFFBEB" },
    { label: "Ingresos del Día", value: formatCurrency(totals.dayTotal), icon: Calendar, color: "#1D9E75", bg: "#ECFDF5" },
    { label: "Promedio por Paciente", value: formatCurrency(totals.average), icon: Users, color: "#203F49", bg: "#F1F3F4" },
  ];

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get("/persona", { params: { search: query, limit: 8 } });
      const data = response.data as { data: Array<{ id_persona: number; primer_nombre: string; segundo_nombre: string | null; primer_apellido: string; segundo_apellido: string | null }> };
      setSearchResults(data.data || []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback((value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchPatients(value), 300);
  }, [searchPatients]);

  const selectPatient = async (p: { id_persona: number; primer_nombre: string; segundo_nombre: string | null; primer_apellido: string }) => {
    const fullName = `${p.primer_nombre} ${p.primer_apellido}`.trim();
    setSelectedPatient({ id: p.id_persona, nombre: fullName });
    setSearchQuery(fullName);
    setShowResults(false);
    setSelectedConsultaId("");
    setPatientConsultas([]);

    setIsLoadingConsultas(true);
    try {
      const response = await consultaService.getByPersona(p.id_persona);
      const consultas = response.data.data;
      setPatientConsultas(
        consultas.map((c) => ({
          id_consulta: c.id_consulta,
          diagnostico: c.diagnostico,
          tratamiento: c.tratamiento,
          fecha_inicio: c.fecha_inicio,
          doctor: `Dr. ${c.doctor.persona.primer_nombre} ${c.doctor.persona.primer_apellido}`,
        }))
      );
    } catch {
      setPatientConsultas([]);
    } finally {
      setIsLoadingConsultas(false);
    }
  };

  const selectedConsulta = patientConsultas.find((c) => String(c.id_consulta) === selectedConsultaId);

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      Pagado: { bg: "#ECFDF5", text: "#1D9E75" },
      Pendiente: { bg: "#FFFBEB", text: "#EF9F27" },
      Parcial: { bg: "#E6F8FB", text: "#0BC5DF" },
    };
    const s = variants[estado] || variants.Pendiente;
    return (
      <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
        {estado}
      </span>
    );
  };

  const getMetodoPagoBadge = (m: string) => (
    <span style={{ background: "#F1F3F4", color: "#5F656A", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {m}
    </span>
  );

  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedConsultaId) {
      setFormError("Seleccione una consulta del paciente");
      return;
    }
    if (!monto) {
      setFormError("Ingrese el monto del ingreso");
      return;
    }
    const payload: CreatePaymentInput = {
      id_consulta: Number(selectedConsultaId),
      fecha,
      abono: Number(monto),
      metodoPago,
      observacion: observaciones || undefined,
    };
    try {
      const response = await billingService.create(payload);
      setRecords([mapPaymentToIncomeRecord(response.data!), ...records]);
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setFormError(error?.message || "No se pudo registrar el ingreso");
    }
  };

  const resetForm = () => {
    setFecha(new Date().toISOString().split("T")[0]);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedPatient(null);
    setPatientConsultas([]);
    setSelectedConsultaId("");
    setMonto("");
    setMetodoPago("Efectivo");
    setObservaciones("");
    setFormError(null);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await billingService.delete(Number(recordToDelete));
      setRecords(records.filter((r) => r.id !== recordToDelete));
    } catch (error: any) {
      setErrorMessage(error?.message || "No se pudo eliminar el ingreso");
    }
    setRecordToDelete(null);
    setIsConfirmOpen(false);
  };

  const columns = [
    { key: "fecha", label: "Fecha", width: 110 },
    {
      key: "paciente", label: "Paciente",
      render: (_val: unknown, r: IncomeRecord) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar initials={`${r.paciente[0]}${r.paciente.split(" ")[1]?.[0] || ""}`} size={24} color="#0BC5DF" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>{r.paciente}</span>
        </div>
      ),
    },
    { key: "tratamiento", label: "Tratamiento" },
    {
      key: "monto", label: "Monto",
      render: (val: unknown) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>
          {formatCurrency(Number(val))}
        </span>
      ),
    },
    { key: "metodoPago", label: "Método de pago", render: (val: unknown) => getMetodoPagoBadge(String(val)) },
    { key: "doctor", label: "Doctor" },
    { key: "estado", label: "Estado", render: (val: unknown) => getEstadoBadge(String(val)) },
  ];

  const getRowActions = (record: IncomeRecord) => [
    { icon: <Eye size={14} />, label: "Ver Detalles", onClick: () => setDetailRecord(record) },
    {
      icon: <Trash2 size={14} />, label: "Eliminar", danger: true,
      onClick: () => { setRecordToDelete(record.id); setIsConfirmOpen(true); },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Alert variant="info" message="Los ingresos se registran automáticamente en el historial del paciente." />
      {errorMessage && <Alert variant="error" message={errorMessage} />}
      {isLoading && <Alert variant="info" message="Cargando ingresos..." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#888F94", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px 0" }}>{kpi.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#203F49", margin: 0 }}>{kpi.value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable<any>
        title="Registros de Ingresos"
        description="Gestiona todos los ingresos de la clínica"
        columns={columns}
        data={records}
        searchable
        searchPlaceholder="Buscar paciente o tratamiento..."
        searchKeys={["paciente", "tratamiento"]}
        filters={[
          {
            key: "metodoPago", placeholder: "Todos los métodos",
            options: [{ value: "Efectivo", label: "Efectivo" }, { value: "Tarjeta", label: "Tarjeta" }, { value: "Transferencia", label: "Transferencia" }],
          },
          {
            key: "estado", placeholder: "Todos los estados",
            options: [{ value: "Pagado", label: "Pagado" }, { value: "Pendiente", label: "Pendiente" }, { value: "Parcial", label: "Parcial" }],
          },
        ]}
        primaryAction={{
          label: "Registrar Ingreso", icon: <Plus size={16} />,
          onClick: () => { setErrorMessage(null); resetForm(); setIsDialogOpen(true); },
        }}
        secondaryActions={[
          { label: "Exportar", icon: <FileSpreadsheet size={13} />, onClick: () => alert("Exportando registros a Excel...") },
          { label: "Imprimir", icon: <Printer size={13} />, onClick: () => window.print() },
        ]}
        rowActions={getRowActions}
        getRowKey={(row) => row.id}
      />

      <Modal open={!!detailRecord} onClose={() => setDetailRecord(null)} title="Detalle del Ingreso" icon={<Eye size={18} style={{ color: "#0BC5DF" }} />} maxWidth={480}>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Fecha", value: detailRecord?.fecha },
              { label: "Paciente", value: detailRecord?.paciente },
              { label: "Tratamiento", value: detailRecord?.tratamiento },
              { label: "No. Consulta", value: `#${detailRecord?.idConsulta}` },
              { label: "Monto", value: detailRecord ? formatCurrency(detailRecord.monto) : "" },
              { label: "Método de pago", value: detailRecord?.metodoPago },
              { label: "Doctor", value: detailRecord?.doctor },
              { label: "Estado", value: detailRecord?.estado },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#888F94", textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#203F49" }}>{f.value}</span>
              </div>
            ))}
          </div>
          {detailRecord?.observacion && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888F94", textTransform: "uppercase", letterSpacing: "0.04em" }}>Observaciones</span>
              <span style={{ fontSize: 14, color: "#5F656A" }}>{detailRecord.observacion}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setDetailRecord(null)}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #D3D7DA", background: "#fff", color: "#5F656A", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={isConfirmOpen}
        variant="danger"
        title="¿Eliminar registro de ingreso?"
        description="Esta acción eliminará el registro permanentemente."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => { setIsConfirmOpen(false); setRecordToDelete(null); }}
        onConfirm={handleDelete}
      />

      <Modal open={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm(); }} title="Registrar Nuevo Ingreso" icon={<DollarSign size={18} style={{ color: "#0BC5DF" }} />}>
        <form onSubmit={handleRegisterIncome} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Fecha</label>
              <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Paciente</label>
              <div style={{ display: "flex", gap: 4 }}>
                <input type="text" placeholder="Buscar por nombre, apellido o identidad..." required
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value); if (selectedPatient && e.target.value !== `${selectedPatient.nombre}`) { setSelectedPatient(null); setPatientConsultas([]); setSelectedConsultaId(""); } }}
                  style={{ ...inputStyle, flex: 1 }} />
                {isSearching && <div style={{ padding: "10px", color: "#888F94" }}>...</div>}
              </div>
              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#fff", border: "1px solid #D3D7DA", borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto",
                }}>
                  {searchResults.map((p) => (
                    <div key={p.id_persona} onClick={() => selectPatient(p)}
                      style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#203F49", borderBottom: "1px solid #F1F3F4" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F3F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                      {p.primer_nombre} {p.segundo_nombre || ""} {p.primer_apellido} {p.segundo_apellido || ""}
                    </div>
                  ))}
                </div>
              )}
              {showResults && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #D3D7DA", borderRadius: 8, padding: 12, fontSize: 12, color: "#888F94" }}>
                  Sin resultados
                </div>
              )}
            </div>
          </div>

          {selectedPatient && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Paciente seleccionado</label>
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#E6F8FB", color: "#203F49", fontSize: 13, fontWeight: 500 }}>
                  {selectedPatient.nombre}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Consulta</label>
                {isLoadingConsultas ? (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F1F3F4", color: "#888F94", fontSize: 13 }}>
                    Cargando consultas...
                  </div>
                ) : patientConsultas.length === 0 ? (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#FFF3E0", color: "#EF9F27", fontSize: 13 }}>
                    No tiene consultas registradas
                  </div>
                ) : (
                  <select value={selectedConsultaId} onChange={(e) => setSelectedConsultaId(e.target.value)} style={inputStyle}>
                    <option value="">Seleccionar consulta...</option>
                    {patientConsultas.map((c) => (
                      <option key={c.id_consulta} value={c.id_consulta}>
                        #{c.id_consulta} — {c.tratamiento || c.diagnostico || "—"} ({c.doctor})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {selectedConsulta && (
            <div style={{ fontSize: 11, color: "#1D9E75", background: "#ECFDF5", padding: "6px 10px", borderRadius: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              <span><strong>Consulta #:</strong> {selectedConsulta.id_consulta}</span>
              <span><strong>Doctor:</strong> {selectedConsulta.doctor}</span>
              <span><strong>Tratamiento:</strong> {selectedConsulta.tratamiento || selectedConsulta.diagnostico || "—"}</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Monto (L)</label>
              <input type="number" step="0.01" placeholder="0.00" required value={monto}
                onChange={(e) => setMonto(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Método de pago</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={inputStyle}>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Observaciones</label>
            <textarea value={observaciones} placeholder="Notas o comentarios adicionales..."
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ ...inputStyle, minHeight: 60, resize: "none", fontFamily: "inherit" }} />
          </div>

          {formError && (
            <div style={{ fontSize: 12, color: "#E53E3E", background: "#FFF5F5", padding: "8px 12px", borderRadius: 6 }}>
              {formError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={() => { setIsDialogOpen(false); resetForm(); }}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #D3D7DA", background: "#fff", color: "#5F656A", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#0BC5DF", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Registrar Ingreso
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #D3D7DA", outline: "none", fontSize: 14, color: "#203F49",
  boxSizing: "border-box",
};
