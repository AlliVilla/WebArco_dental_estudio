import { useState, useEffect } from "react";
import { Card, Alert, Button, Input, Select } from "../../../context";
import { ConfirmModal } from "../../../components";
import { useResponsive } from "../../../hooks/useWindowWidth";
import billingService from "../services/billingService";

export interface CuentaDestinoItem {
  id: number;
  tipo: string;
  nombre: string;
  comision: number | null;
}

interface CuentasDestinoConfigProps {
  configItems: CuentaDestinoItem[];
  onConfigChange: (items: CuentaDestinoItem[]) => void;
}

export function CuentasDestinoConfig({
  configItems,
  onConfigChange,
}: CuentasDestinoConfigProps) {
  const { isMobile } = useResponsive();
  const [expanded, setExpanded] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState<"TARJETA" | "TRANSFERENCIA">("TARJETA");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoComision, setNuevoComision] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const cargar = async () => {
    try {
      const res = await billingService.getCuentasDestino();
      if (res.success && res.data) {
        onConfigChange((res.data as any).data || []);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const agregar = async () => {
    if (!nuevoNombre.trim()) {
      setError("Ingrese un nombre");
      return;
    }
    const comision =
      nuevoComision.trim() !== "" ? parseFloat(nuevoComision) : undefined;
    if (
      nuevoComision.trim() !== "" &&
      (isNaN(comision!) || comision! < 0)
    ) {
      setError("Comisión inválida");
      return;
    }
    try {
      const res = await billingService.createCuentaDestino({
        tipo: nuevoTipo,
        nombre: nuevoNombre.trim(),
        comision,
      });
      if (res.success) {
        setSuccess(`"${nuevoNombre.trim()}" agregado`);
        setNuevoNombre("");
        setNuevoComision("");
        setError(null);
        await cargar();
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Error al agregar"
      );
    }
  };

  const eliminar = async (id: number) => {
    try {
      const res = await billingService.deleteCuentaDestino(id);
      if (res.success) {
        setSuccess("Cuenta destino eliminada");
        setError(null);
        await cargar();
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Error al eliminar"
      );
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const gridStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: 8,
    alignItems: isMobile ? "stretch" : "flex-end",
  };

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#203F49" }}>
          Configurar cuentas destino
        </span>
        <span style={{ fontSize: 12, color: "#888F94" }}>
          {expanded ? "▲ Ocultar" : "▼ Administrar"}
        </span>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {error && <Alert variant="error" message={error} />}
          {success && <Alert variant="success" message={success} />}

          <div style={gridStyle}>
            <div style={{ flex: 1 }}>
              <Select
                label="Tipo"
                value={nuevoTipo}
                onChange={(v) => setNuevoTipo(v as "TARJETA" | "TRANSFERENCIA")}
                options={[
                  { value: "TARJETA", label: "POS (Tarjeta)" },
                  { value: "TRANSFERENCIA", label: "Cuenta (Transferencia)" },
                ]}
              />
            </div>
            <div style={{ flex: 2, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Input
                label="Nombre"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: BAC, Ficohsa..."
                style={{ lineHeight: "20px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void agregar();
                }}
              />
            </div>
            <div style={{ width: isMobile ? "100%" : 120, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Input
                label="Comisión %"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={nuevoComision}
                onChange={(e) => setNuevoComision(e.target.value)}
                placeholder="2.5"
                style={{ lineHeight: "20px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void agregar();
                }}
              />
            </div>
            <Button
              variant="primary"
              onClick={() => void agregar()}
              style={{ height: 36 }}
            >
              Agregar
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 16,
            }}
          >
            {(["TARJETA", "TRANSFERENCIA"] as const).map((tipo) => (
              <div
                key={tipo}
                style={{
                  border: "1px solid #EAECEE",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#203F49",
                  }}
                >
                  {tipo === "TARJETA"
                    ? "POS (Tarjeta)"
                    : "Cuentas (Transferencia)"}
                </p>
                {configItems.filter((i) => i.tipo === tipo).length === 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#888F94",
                      fontStyle: "italic",
                    }}
                  >
                    Sin elementos
                  </span>
                ) : (
                  configItems
                    .filter((i) => i.tipo === tipo)
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "5px 8px",
                          borderRadius: 4,
                          background: "#F8F9FA",
                          marginBottom: 4,
                          fontSize: 12,
                          gap: 8,
                        }}
                      >
                        <span style={{ color: "#203F49", flex: 1 }}>
                          {item.nombre}
                        </span>
                        <span style={{ color: "#5F656A", fontSize: 11 }}>
                          {item.comision != null ? item.comision : 0}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#EF4444",
                            cursor: "pointer",
                            fontSize: 13,
                            padding: 0,
                            flexShrink: 0,
                          }}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <ConfirmModal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) {
            void eliminar(deleteConfirmId);
          }
        }}
        variant="danger"
        title="Eliminar Cuenta Destino"
        description="¿Estás seguro de eliminar esta cuenta destino? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </Card>
  );
}
