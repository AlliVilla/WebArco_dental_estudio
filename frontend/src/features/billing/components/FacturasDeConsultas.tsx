import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Clock
} from "lucide-react";
import { DataTable } from "../../../components/DataTable";
import { Button } from "../../../context";
import { consultationService } from "../../consultations/services/consultationService";
import { Consultation } from "../../consultations/types";
import { FacturaCobroDetalle } from "./FacturaCobroDetalle";

export function FacturasDeConsultas() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsulta, setSelectedConsulta] = useState<Consultation | null>(null);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await consultationService.getAll();
      if (res.success && res.data) {
        const dataArray = Array.isArray(res.data) ? res.data : (res.data as any).data;
        
        if (Array.isArray(dataArray)) {
          const sorted = [...dataArray].sort(
            (a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
          );
          setConsultations(sorted);
        } else {
          setConsultations([]);
        }
      }
    } catch (error) {
      console.error("Error loading consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConsulta = (consulta: Consultation) => {
    setSelectedConsulta(consulta);
  };

  const getFinancialTotals = (row: Consultation) => {
    const isvRate = 0.15;
    const tratamientosLista = row.tratamientos || [];
    const subtotalBruto = tratamientosLista.reduce((acc, t) => acc + (Number(t.precio) || Number(t.tratamiento?.precio) || 0), 0);
    const totalDescuento = tratamientosLista.reduce((acc, t) => {
      const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
      return acc + (p * (Number(t.descuento) / 100));
    }, 0);
    const subtotalNeto = subtotalBruto - totalDescuento;
    const totalAPagar = subtotalNeto + (subtotalNeto * isvRate);

    const pagosAnterioresPaciente = row.pagos || [];
    const montoPagado = pagosAnterioresPaciente.reduce((acc, p) => {
      return acc + Number((p as any).abono);
    }, 0);

    const saldoPendiente = Math.max(0, totalAPagar - montoPagado);
    return { totalAPagar, montoPagado, saldoPendiente };
  };

  const columns = [
    { key: "id_consulta", label: "ID", width: 60 },
    {
      key: "fecha_inicio",
      label: "Fecha",
      render: (val: any) => new Date(val).toLocaleDateString("es-HN", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      }),
    },
    {
      key: "paciente",
      label: "Paciente",
      render: (_: any, row: Consultation) => {
        if (!row.persona) return "Desconocido";
        const nombre = (row.persona as any).primer_nombre || (row.persona as any).nombre || "";
        const apellido = (row.persona as any).primer_apellido || (row.persona as any).apellido || "";
        return `${nombre} ${apellido}`.trim() || "Desconocido";
      },
    },
    {
      key: "doctor",
      label: "Dentista",
      render: (_: any, row: Consultation) => {
        if (!row.doctor) return "N/A";
        const docPersona = (row.doctor as any).persona;
        if (docPersona) {
          return `${docPersona.primer_nombre || ""} ${docPersona.primer_apellido || ""}`.trim();
        }
        return (row.doctor as any).nombre || (row.doctor as any).username || "N/A";
      },
    },
    {
      key: "diagnostico",
      label: "Diagnóstico",
      render: (val: any) => (
        <span style={{ maxWidth: 150, display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {val || "-"}
        </span>
      ),
    },
    {
      key: "motivo",
      label: "Motivo",
      render: (val: any) => (
        <span style={{ maxWidth: 150, display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {val || "-"}
        </span>
      ),
    },
    {
      key: "tratamiento",
      label: "Tratamientos Aplicados",
      render: (_: any, row: Consultation) => {
        const nombres = row.tratamientos?.map(t => t.tratamiento?.nombre).filter(Boolean);
        const text = nombres && nombres.length > 0 ? nombres.join(", ") : (row.tratamiento || "Consulta General");
        return (
          <span style={{ maxWidth: 200, display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {text}
          </span>
        );
      },
    },
    {
      key: "monto_total",
      label: "Total",
      render: (_: any, row: Consultation) => {
        const { totalAPagar } = getFinancialTotals(row);
        return `L ${totalAPagar.toFixed(2)}`;
      },
    },
    {
      key: "monto_pagado",
      label: "Pagado",
      render: (_: any, row: Consultation) => {
        const { montoPagado } = getFinancialTotals(row);
        return <span style={{ color: "#10b981", fontWeight: 500 }}>L {montoPagado.toFixed(2)}</span>;
      },
    },
    {
      key: "saldo_pendiente",
      label: "Pendiente",
      render: (_: any, row: Consultation) => {
        const { saldoPendiente } = getFinancialTotals(row);
        return <span style={{ color: saldoPendiente > 0 ? "#ef4444" : "#64748b", fontWeight: 500 }}>L {saldoPendiente.toFixed(2)}</span>;
      },
    },
    {
      key: "estado",
      label: "Estado",
      align: "center" as const,
      render: (_: any, row: Consultation) => {
        const { saldoPendiente } = getFinancialTotals(row);
        const isPaid = saldoPendiente <= 0;
        
        if (isPaid) {
          return (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500,
              background: "#ECFDF3", color: "#027A48"
            }}>
              <CheckCircle2 size={12} /> Pagada
            </span>
          );
        }
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500,
            background: "#FFFAEB", color: "#B54708"
          }}>
            <Clock size={12} /> Pendiente
          </span>
        );
      },
    },
    {
      key: "acciones",
      label: "Acción",
      align: "center" as const,
      render: (_: any, row: Consultation) => {
        const { saldoPendiente } = getFinancialTotals(row);
        const isPaid = saldoPendiente <= 0;
        
        if (isPaid) {
          return (
            <Button variant="secondary" size="sm" onClick={() => handleSelectConsulta(row)} style={{ color: "#64748b", borderColor: "#e2e8f0" }}>
              Ver Detalles
            </Button>
          );
        }
        return (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleSelectConsulta(row)}
            style={{ background: "#0ea5e9", borderColor: "#0ea5e9", color: "#fff" }}
          >
            Cobrar
          </Button>
        );
      },
    }
  ];

  if (selectedConsulta) {
    return (
      <FacturaCobroDetalle 
        consulta={selectedConsulta} 
        onBack={() => {
          setSelectedConsulta(null);
          loadConsultations();
        }} 
        onPaymentSuccess={() => {
          loadConsultations();
          // We don't automatically close so they can see the receipt or the updated status
          // If we want it to close, we call setSelectedConsulta(null)
          // Let's reload data but keep the view so it updates to "Pagada".
          // We need to fetch the updated consultation from the API to show the latest payments.
          consultationService.getById(selectedConsulta.id_consulta).then(res => {
            if (res.success && res.data) {
              setSelectedConsulta(res.data);
            }
          });
        }} 
      />
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 20 }}>
      {/* Columna Izquierda: Tabla */}
      <div style={{ flex: 1, minWidth: 0, transition: "all 0.3s" }}>
        <DataTable
          title="Gestión de Pago"
          description="Gestión de cobros para los tratamientos aplicados en las consultas."
          columns={columns}
          data={consultations}
          searchable
          searchPlaceholder="Buscar por paciente o tratamiento..."
          searchKeys={["tratamiento", "diagnostico", "motivo"]}
          pageSize={10}
        />
      </div>
    </div>
  );
}
