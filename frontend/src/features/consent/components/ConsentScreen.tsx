import { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ConfirmModal } from "../../../components";
import { useTheme } from "../../../context";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { ConsentFormFlow } from "./ConsentFormFlow";
import { ConsentListTable } from "./ConsentListTable";
import { ConsentPreview } from "./ConsentPreview";
import { ConsentSearchCard } from "./ConsentSearchCard";
import { formatDisplayDate, formatDisplayTime } from "../services/consentUtils";
import { exportToExcel } from "../../../utils/exportToExcel";
import { consentimientoService } from "../services/consentimiento.service";
import type {
  Consentimiento,
  ConsentimientoStats,
  QueryConsentimientoParams,
} from "../types/consentimiento";
import type {
  ConsentFormValues,
  ConsentMode,
  ConsentRecord,
  ConsentScreenProps,
  ConsentStep,
  SignatureTarget,
} from "../types";

function apiToLocal(c: Consentimiento): ConsentRecord {
  return {
    id: String(c.id_consulta),
    paciente: [
      c.paciente.primer_nombre,
      c.paciente.segundo_nombre,
      c.paciente.primer_apellido,
      c.paciente.segundo_apellido,
    ]
      .filter(Boolean)
      .join(" "),
    procedimiento: c.tratamiento ?? "",
    doctor: c.doctor.nombre,
    patientId: c.paciente.id_persona, // Mantenemos el ID real del paciente
    doctorId: c.doctor.id_usuario,   // Mantenemos el ID real del doctor
    fecha: formatDisplayDate(c.fecha),
    hora: formatDisplayTime(c.fecha),
    estado:
      c.estado_firmas === "completo"
        ? "firmado"
        : c.estado_firmas === "pendiente"
          ? "pendiente_doctor"
          : "pendiente_paciente",
    patientSignature: (c as any).firma_paciente || "",
    doctorSignature: (c as any).firma_doctor || (c as any).firma_doctor_snapshot || "",
    declaracion: "Declaro que he sido informado sobre el procedimiento y he proporcionado información veraz sobre mi estado de salud.",
    riesgos: (c as any).diagnostico || (c as any).notas || "No se especificaron riesgos adicionales.",
    clausula: "Autorizo la realización del tratamiento descrito y acepto los términos del consentimiento informado.",
  };
}

const defaultFormValues: ConsentFormValues = {
  paciente: "",
  doctor: "",
  procedimiento: "",
  fechaHora: new Date().toISOString().slice(0, 16),
  declaracion: "",
  riesgos: "",
  clausula: "",
};

export function ConsentScreen({ patientName }: ConsentScreenProps) {
  useTheme();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const mode = (searchParams.get("mode") as ConsentMode | null) ?? "list";
  const selectedId = searchParams.get("id");
  const patientNameFromQuery = searchParams.get("patientName") ?? undefined;

  // ─── Estado API ──────────────────────────────────────────────────────────
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [stats, setStats] = useState<ConsentimientoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<QueryConsentimientoParams>({
    limit: 10,
    paciente: patientNameFromQuery,
  });

  // ─── Estado UI ───────────────────────────────────────────────────────────
  const [formValues, setFormValues] = useState<ConsentFormValues>({
    ...defaultFormValues,
    paciente: patientNameFromQuery ?? patientName ?? "",
  });
  const [currentStep, setCurrentStep] = useState<ConsentStep>(1);
  const [patientSignature, setPatientSignature] = useState("");
  const [doctorSignature, setDoctorSignature] = useState("");
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget>("patient");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  // ─── Doctor seleccionado (id real de la API) ──────────────────────────────
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null); // ← nuevo
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const selectedConsent = useMemo(
    () => (selectedId ? consents.find((c) => c.id === selectedId) : undefined) ?? consents[0],
    [consents, selectedId]
  );

  // ─── Carga de datos ──────────────────────────────────────────────────────
  const fetchConsents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        consentimientoService.getAll({ ...filters, page }),
        consentimientoService.getStats(),
      ]);
      if (listRes.data) {
        console.log(listRes.data.data)
        setConsents(listRes.data.data.map(apiToLocal));
        setTotal(listRes.data.total);
        setTotalPages(listRes.data.totalPages);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Error cargando consentimientos:", err);
      setError("No se pudieron cargar los consentimientos");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (mode === "list") {
      fetchConsents();
    }
  }, [mode, fetchConsents]);

  // ─── Navegación por URL ──────────────────────────────────────────────────
  function openMode(nextMode: ConsentMode, id?: string) {
    const params = new URLSearchParams(location.search);
    if (nextMode === "list") {
      params.delete("mode");
      params.delete("id");
    } else {
      params.set("mode", nextMode);
      if (id) params.set("id", id);
    }
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: false }
    );
  }

  // ─── Filtros ─────────────────────────────────────────────────────────────
  function handleFilterChange(newFilters: Partial<QueryConsentimientoParams>) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }

  // ─── Acciones del formulario ─────────────────────────────────────────────
  function startNewConsent() {
    setFormValues({
      ...defaultFormValues,
      paciente: patientNameFromQuery ?? patientName ?? "",
    });
    setPatientSignature("");
    setDoctorSignature("");
    setSignatureTarget("patient");
    setCurrentStep(1);
    setSelectedPatientId(null);
    setSelectedDoctorId(null); // ← reset al abrir nuevo
    openMode("new");
  }

  function startEdit(consent: ConsentRecord) {
    setFormValues({
      paciente: consent.paciente,
      doctor: consent.doctor,
      procedimiento: consent.procedimiento,
      fechaHora:
        (consent.fechaHora as string | undefined) ??
        new Date().toISOString().slice(0, 16),
      declaracion: consent.declaracion,
      riesgos: consent.riesgos,
      clausula: consent.clausula,
    });
    setPatientSignature(consent.patientSignature ?? "");
    setDoctorSignature(consent.doctorSignature ?? "");
    setSignatureTarget(consent.patientSignature ? "doctor" : "patient");
    setCurrentStep(1);
    setSelectedPatientId((consent as any).patientId ?? null); // Restauramos el ID del paciente
    setSelectedDoctorId((consent as any).doctorId ?? null);   // Restauramos el ID del doctor
    openMode("edit", consent.id);
  }

  function updateFormValue(field: keyof ConsentFormValues, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  /**
   * Crea el consentimiento en la base de datos y redirige al paso indicado.
   * targetStep 2: Va a firma del paciente.
   * targetStep 4: Va a completado (Guardar sin firmas).
   */
  async function handleCreateConsent(targetStep: ConsentStep = 4) {
    if (!selectedDoctorId || !selectedPatientId) {
      console.error("Faltan datos obligatorios para crear el consentimiento");
      return;
    }
    try {
      const res = await consentimientoService.create({
        id_paciente: selectedPatientId,
        id_doctor: selectedDoctorId,
        fecha: formValues.fechaHora,
        tipo_tratamiento: formValues.procedimiento,
        diagnostico: formValues.declaracion,
      });

      const newId = res.data?.id_consulta;
      if (newId) {
        // Actualizamos la URL para pasar de 'new' a 'edit' con el ID generado.
        // Esto permite que selectedId esté disponible para guardar las firmas.
        const params = new URLSearchParams(location.search);
        params.set("mode", "edit");
        params.set("id", String(newId));
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
      }

      setCurrentStep(targetStep);
      if (targetStep === 2) setSignatureTarget("patient");

      fetchConsents();
    } catch (err) {
      console.error("Error al crear consentimiento:", err);
    }
  }

  // ─── Flujo de pasos (firma) ──────────────────────────────────────────────
  function handleContinueFromForm() {
    if (mode === "new") {
      handleCreateConsent(2);
    } else {
      setCurrentStep(2);
      setSignatureTarget("patient");
    }
  }

  function handleSaveWithoutSignatures() {
    if (mode === "new") {
      handleCreateConsent(4);
    } else {
      setCurrentStep(4);
    }
  }

  async function handleSavePatientSignature() {
    if (!patientSignature || !selectedId) return;
    // No persistimos inmediatamente. Guardamos en el estado local y avanzamos al paso del doctor.
    // La firma se mantiene como Base64 en la variable 'patientSignature'.
    setCurrentStep(3);
    setSignatureTarget("doctor");
  }

  async function handleSaveDoctorSignature() {
    if (!selectedId) return;
    try {
      const updates: any = {};

      // Si el paciente firmó en este flujo (Base64), preparamos su archivo
      if (patientSignature && patientSignature.startsWith("data:image")) {
        updates.firma_paciente = patientSignature;
      }

      // Si el doctor firmó en este flujo (Base64), preparamos su archivo
      if (doctorSignature && doctorSignature.startsWith("data:image")) {
        updates.firma_doctor = doctorSignature;
      }

      // Solo llamamos a la API si hay al menos una firma nueva que guardar
      if (Object.keys(updates).length > 0) {
        await consentimientoService.updateSignatures(Number(selectedId), updates);
      }

      setCurrentStep(4);
      fetchConsents();
    } catch (err) {
      console.error("Error al procesar el guardado final de firmas:", err);
    }
  }

  async function handleSkipToFinish() {
    // Caso especial: Si el paciente firmó pero el doctor omite su firma, 
    // debemos persistir la firma del paciente antes de terminar.
    if (selectedId && patientSignature && patientSignature.startsWith("data:image")) {
      try {
        await consentimientoService.updateSignatures(Number(selectedId), { firma_paciente: patientSignature });
      } catch (err) {
        console.error("Error al guardar firma del paciente al omitir paso del doctor:", err);
      }
    }
    setCurrentStep(4);
    fetchConsents();
  }

  // ─── Exportar ────────────────────────────────────────────────────────────
  const handleExportToExcel = async () => {
    try {
      const columnas = [
        { header: "ID", key: "id", width: 12 },
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Paciente", key: "paciente", width: 25 },
        { header: "Procedimiento", key: "procedimiento", width: 25 },
        { header: "Doctor", key: "doctor", width: 25 },
        { header: "Estado", key: "estado", width: 20 },
      ];
      await exportToExcel(
        consents,
        columnas,
        "Consentimientos",
        "Consentimientos_WebArco"
      );
    } catch (err) {
      console.error("Error al exportar a Excel:", err);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        width: "100%",
      }}
    >
      {patientNameFromQuery && (
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#888F94",
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
            width: "fit-content",
          }}
        >
          <ArrowLeft size={16} /> Volver al perfil
        </button>
      )}

      {mode === "list" && (
        <>
          <ConsentSearchCard
            totalConsents={total}
            totalFirmados={stats?.completos ?? 0}
            totalPendientesDoctor={stats?.pendientes ?? 0}
            consents={consents}
            loading={loading}
            error={error}
            onFilterChange={handleFilterChange}
          />
          <ConsentListTable
            consents={consents}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onFilterChange={handleFilterChange}
            onPreview={(id) => openMode("preview", id)}
            onEdit={startEdit}
            onNewConsent={startNewConsent}
            onExport={handleExportToExcel}
          />
        </>
      )}

      {(mode === "new" || mode === "edit") && (
        (mode === "new" || (mode === "edit" && selectedConsent)) ? (
          <ConsentFormFlow
          isEditing={mode === "edit"}
          selectedConsent={selectedConsent}
          formValues={formValues}
          currentStep={currentStep}
          signatureTarget={signatureTarget}
          patientSignature={patientSignature}
          doctorSignature={doctorSignature}
          selectedDoctorId={selectedDoctorId}          // ← nuevo
          selectedPatientId={selectedPatientId}        // ← nuevo
          onPatientIdChange={setSelectedPatientId}     // ← nuevo
          onDoctorIdChange={setSelectedDoctorId}       // ← nuevo
          onFormChange={updateFormValue}
          onCancel={() => setConfirmCloseOpen(true)}
          onContinueFromForm={handleContinueFromForm}
          onSaveWithoutSignatures={handleSaveWithoutSignatures}
          onSkipToFinish={handleSkipToFinish}
          onPatientSignatureChange={setPatientSignature}
          onDoctorSignatureChange={setDoctorSignature}
          onStepChange={setCurrentStep}
          onSignatureTargetChange={setSignatureTarget}
          onSavePatientSignature={handleSavePatientSignature}
          onSaveDoctorSignature={handleSaveDoctorSignature}
          onFinish={() => openMode("list")}
        />
        ) : null
      )}

      {mode === "preview" && selectedConsent && (
        <ConsentPreview
          selectedConsent={selectedConsent}
          onClose={() => openMode("list")}
        />
      )}

      <ConfirmModal
        open={confirmCloseOpen}
        variant="danger"
        title="Cancelar consentimiento"
        description="Se perderán los cambios del formulario y las firmas capturadas que no hayan sido guardadas."
        confirmLabel="Sí, cancelar"
        cancelLabel="Seguir editando"
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          openMode("list");
        }}
      />
    </div>
  );
}