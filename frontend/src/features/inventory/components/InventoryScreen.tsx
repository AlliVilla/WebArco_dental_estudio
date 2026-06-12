import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import {
  Archive,
  Boxes,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  PackagePlus,
  Plus,
  RotateCcw,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";

import { ConfirmModal, DataTable, type Column } from "../../../components";
import {
  Alert,
  Button,
  Card,
  Input,
  SectionBlock,
  Select,
} from "../../../context";
import { useTheme } from "../../../context/ThemeContext";
import { inventoryService } from "../services/inventoryService";
import { formatCurrency } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
import type {
  CategoriaInsumo,
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  InventoryItem,
  InventoryStats,
  TipoMovimientoInventario,
  UnidadMedidaInsumo,
} from "../types";

export interface InventoryScreenProps {}

type ItemFormState = {
  nombre: string;
  categoria: CategoriaInsumo | "";
  unidad_medida: UnidadMedidaInsumo | "";
  stock_actual: string;
  stock_minimo: string;
  precio_costo: string;
};

type MovementFormState = {
  tipo: TipoMovimientoInventario | "";
  id_insumo: string;
  cantidad: string;
  fecha: string;
  observaciones: string;
};

const emptyItemForm: ItemFormState = {
  nombre: "",
  categoria: "",
  unidad_medida: "",
  stock_actual: "0",
  stock_minimo: "0",
  precio_costo: "0.00",
};

const categoryOptions = [
  { value: "Anestesia", label: "Anestesia" },
  { value: "Higiene", label: "Higiene" },
  { value: "Materiales", label: "Materiales" },
  { value: "Instrumental", label: "Instrumental" },
  { value: "Medicamento", label: "Medicamento" },
  { value: "Otro", label: "Otro" },
];

const unitOptions = [
  { value: "Unidad", label: "Unidad" },
  { value: "Caja", label: "Caja" },
  { value: "Frasco", label: "Frasco" },
  { value: "Paquete", label: "Paquete" },
  { value: "Kit", label: "Kit" },
  { value: "Tubo", label: "Tubo" },
  { value: "Bolsa", label: "Bolsa" },
];

const todayInputValue = () => new Date().toISOString().slice(0, 10);

export function InventoryScreen(_props: InventoryScreenProps) {
  useTheme();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_productos: 0,
    stock_bajo: 0,
    agotados: 0,
    valor_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [movementForm, setMovementForm] = useState<MovementFormState>({
    tipo: "",
    id_insumo: "",
    cantidad: "0",
    fecha: todayInputValue(),
    observaciones: "",
  });

  const loadInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const inventoryResponse = await inventoryService.getAll();
      setItems(inventoryResponse.data.data);
      setStats(inventoryResponse.data.stats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const nextCode = useMemo(() => {
    const last =
      items.reduce((max, item) => Math.max(max, item.id_insumo), 0) + 1;
    return `INS-${String(last).padStart(3, "0")}`;
  }, [items]);

  const columns: Column<InventoryItem>[] = useMemo(
    () => [
      {
        key: "codigo",
        label: "Código",
        width: 92,
        render: (value) => (
          <strong style={{ color: "#203F49", fontWeight: 500 }}>
            {String(value)}
          </strong>
        ),
      },
      {
        key: "nombre",
        label: "Nombre",
        render: (value) => (
          <span style={{ color: "#203F49", fontWeight: 500 }}>
            {String(value)}
          </span>
        ),
      },
      {
        key: "categoria",
        label: "Categoría",
        render: (value) => <CategoryBadge value={String(value)} />,
      },
      { key: "unidad_medida", label: "Unidad", width: 90 },
      {
        key: "stock_actual",
        label: "Stock act.",
        align: "center",
        width: 90,
        render: (value, row) => (
          <span
            style={{
              color:
                row.estado === "Agotado"
                  ? "#E24B4A"
                  : row.estado === "Stock bajo"
                  ? "#EF9F27"
                  : "#203F49",
              fontWeight: 600,
            }}
          >
            {String(value)}
          </span>
        ),
      },
      { key: "stock_minimo", label: "Stock mín.", align: "center", width: 90 },
      {
        key: "precio_costo",
        label: "Precio costo",
        width: 116,
        render: (value) => (
          <span style={{ color: "#203F49", fontWeight: 500 }}>
            {formatCurrency(Number(value))}
          </span>
        ),
      },
      {
        key: "estado",
        label: "Stock",
        align: "center",
        width: 110,
        render: (value) => <InventoryStatusBadge status={String(value)} />,
      },
      {
        key: "estado_registro",
        label: "Registro",
        align: "center",
        width: 110,
        render: (value) => <RecordStatusBadge status={String(value)} />,
      },
    ],
    []
  );

  const openCreateItem = () => {
    setSelectedItem(null);
    setItemForm(emptyItemForm);
    setItemModalOpen(true);
  };
  const openEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setItemForm({
      nombre: item.nombre,
      categoria: item.categoria,
      unidad_medida: item.unidad_medida,
      stock_actual: String(item.stock_actual),
      stock_minimo: String(item.stock_minimo),
      precio_costo: String(item.precio_costo),
    });
    setItemModalOpen(true);
  };
  const openMovementModal = (item?: InventoryItem) => {
    setMovementForm({
      tipo: "",
      id_insumo: item ? String(item.id_insumo) : "",
      cantidad: "0",
      fecha: todayInputValue(),
      observaciones: "",
    });
    setMovementModalOpen(true);
  };

  const saveItem = async () => {
    const payload = validateItemForm(itemForm);
    if (!payload.ok) {
      setError(payload.message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (selectedItem) {
        await inventoryService.update(selectedItem.id_insumo, payload.data);
        setSuccess("Insumo actualizado correctamente.");
      } else {
        await inventoryService.create(payload.data);
        setSuccess("Insumo creado correctamente.");
      }
      setItemModalOpen(false);
      await loadInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveMovement = async () => {
    const payload = validateMovementForm(movementForm);
    if (!payload.ok) {
      setError(payload.message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await inventoryService.createMovement(payload.data);
      setSuccess("Movimiento registrado correctamente.");
      setMovementModalOpen(false);
      await loadInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!itemToDelete) return;
    setSaving(true);
    setError("");
    try {
      await inventoryService.delete(itemToDelete.id_insumo);
      setSuccess("Insumo marcado como inactivo correctamente.");
      setItemToDelete(null);
      await loadInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const restoreItem = async (item: InventoryItem) => {
    setSaving(true);
    setError("");
    try {
      await inventoryService.restore(item.id_insumo);
      setSuccess("Insumo readmitido correctamente.");
      await loadInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Grid de métricas: 4 en desktop, 2 en tablet/móvil
  const metricCols =
    isMobile || isTablet ? "repeat(2, 1fr)" : "repeat(4, minmax(150px, 1fr))";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Alert
        variant="info"
        message="El stock se actualiza automáticamente al registrar una entrada o salida."
        onClose={() => undefined}
      />
      {stats.stock_bajo > 0 && (
        <Alert
          variant="warning"
          message={`Los siguientes productos están por debajo del stock mínimo (${stats.stock_bajo} productos).`}
          onClose={() => undefined}
        />
      )}
      {stats.agotados > 0 && (
        <Alert
          variant="error"
          message={`Hay ${stats.agotados} productos agotados. Revisa el inventario.`}
          onClose={() => undefined}
        />
      )}
      {error && (
        <Alert variant="error" message={error} onClose={() => setError("")} />
      )}
      {success && (
        <Alert
          variant="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* Métricas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: metricCols,
          gap: isMobile ? 10 : 16,
        }}
      >
        <MetricCard
          label="Total de productos"
          value={String(stats.total_productos)}
          icon={<Boxes size={22} />}
          tone="primary"
        />
        <MetricCard
          label="Stock bajo"
          value={String(stats.stock_bajo)}
          icon={<TrendingDown size={22} />}
          tone="warning"
        />
        <MetricCard
          label="Agotados"
          value={String(stats.agotados)}
          icon={<TrendingDown size={22} />}
          tone="danger"
        />
        <MetricCard
          label="Valor total"
          value={formatCurrency(stats.valor_total)}
          icon={<DollarSign size={24} />}
          tone="success"
        />
      </div>

      <DataTable<InventoryItem>
        title="Inventario de Insumos"
        description="Gestiona todos los insumos y materiales de la clínica"
        columns={columns}
        data={items}
        pageSize={10}
        searchable
        searchPlaceholder="Buscar nombre o código..."
        searchKeys={["codigo", "nombre"]}
        filters={[
          {
            key: "categoria",
            placeholder: "Categoría",
            options: categoryOptions,
          },
          {
            key: "estado",
            placeholder: "Estado de Stock",
            options: [
              { value: "Normal", label: "Normal" },
              { value: "Stock bajo", label: "Stock bajo" },
              { value: "Agotado", label: "Agotado" },
            ],
          },
          {
            key: "estado_registro",
            placeholder: "Estado del registro",
            options: [
              { value: "Activo", label: "Activo" },
              { value: "Inactivo", label: "Inactivo" },
            ],
          },
        ]}
        primaryAction={{
          label: "Nuevo insumo",
          icon: <Plus size={16} />,
          onClick: openCreateItem,
        }}
        secondaryActions={[
          {
            label: "Registrar movimiento",
            icon: <PackagePlus size={16} />,
            onClick: () => openMovementModal(),
          },
          {
            label: "Ver historial",
            icon: <FileText size={16} />,
            onClick: () => navigate("/inventory/history"),
          },
          {
            label: "Exportar inventario",
            icon: <Archive size={16} />,
            onClick: () => exportInventoryCsv(items),
          },
        ]}
        rowActions={(row) =>
          row.activo
            ? [
                {
                  icon: <Eye size={15} />,
                  label: "Registrar movimiento",
                  onClick: () => openMovementModal(row),
                },
                {
                  icon: <Edit2 size={15} />,
                  label: "Editar",
                  onClick: () => openEditItem(row),
                },
                {
                  icon: <Trash2 size={15} />,
                  label: "Eliminar",
                  danger: true,
                  onClick: () => setItemToDelete(row),
                },
              ]
            : [
                {
                  icon: <RotateCcw size={15} />,
                  label: "Readmitir",
                  onClick: () => void restoreItem(row),
                },
                {
                  icon: <Edit2 size={15} />,
                  label: "Editar",
                  onClick: () => openEditItem(row),
                },
              ]
        }
        getRowKey={(row) => String(row.id_insumo)}
        emptyMessage={
          loading ? "Cargando inventario..." : "No hay insumos registrados."
        }
        footer={<InventoryLegend />}
      />

      {/* Modal: Nuevo / Editar insumo */}
      {itemModalOpen && (
        <Modal
          title={selectedItem ? "Editar insumo" : "Nuevo insumo"}
          subtitle="Los campos marcados con * son obligatorios"
          onClose={() => setItemModalOpen(false)}
          isMobile={isMobile}
        >
          <SectionBlock title="Datos del insumo">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 14,
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Código"
                  badge="required"
                  value={selectedItem?.codigo ?? nextCode}
                  disabled
                  hint="Autogenerado por el sistema, no editable"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Nombre del insumo"
                  badge="required"
                  value={itemForm.nombre}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  placeholder="Ej. Anestesia Lidocaína 2%"
                />
              </div>
              <Select
                label="Categoría"
                badge="required"
                placeholder="Seleccionar"
                options={categoryOptions}
                value={itemForm.categoria}
                onChange={(value) =>
                  setItemForm((prev) => ({
                    ...prev,
                    categoria: value as CategoriaInsumo,
                  }))
                }
              />
              <Select
                label="Unidad de medida"
                badge="required"
                placeholder="Seleccionar"
                options={unitOptions}
                value={itemForm.unidad_medida}
                onChange={(value) =>
                  setItemForm((prev) => ({
                    ...prev,
                    unidad_medida: value as UnidadMedidaInsumo,
                  }))
                }
              />
              <Input
                label="Stock actual"
                badge="required"
                type="number"
                min="0"
                value={itemForm.stock_actual}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    stock_actual: e.target.value,
                  }))
                }
              />
              <Input
                label="Stock mínimo"
                badge="required"
                type="number"
                min="0"
                value={itemForm.stock_minimo}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    stock_minimo: e.target.value,
                  }))
                }
                hint="Define el umbral de alerta"
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Precio unitario de costo"
                  badge="required"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.precio_costo}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      precio_costo: e.target.value,
                    }))
                  }
                  hint="Dos decimales, valor positivo"
                />
              </div>
            </div>
          </SectionBlock>
          <ModalActions>
            <Button variant="secondary" onClick={() => setItemModalOpen(false)}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={saveItem}>
              {selectedItem ? "Guardar cambios" : "Crear insumo"}
            </Button>
          </ModalActions>
        </Modal>
      )}

      {/* Modal: Registrar movimiento */}
      {movementModalOpen && (
        <Modal
          title="Registrar movimiento"
          subtitle="Los campos marcados con * son obligatorios"
          onClose={() => setMovementModalOpen(false)}
          isMobile={isMobile}
        >
          <SectionBlock title="Movimiento de inventario">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 14,
              }}
            >
              <Select
                label="Tipo de movimiento"
                badge="required"
                placeholder="Seleccionar"
                options={[
                  { value: "Entrada", label: "Entrada" },
                  { value: "Salida", label: "Salida" },
                ]}
                value={movementForm.tipo}
                onChange={(value) =>
                  setMovementForm((prev) => ({
                    ...prev,
                    tipo: value as TipoMovimientoInventario,
                  }))
                }
              />
              <Select
                label="Producto"
                badge="required"
                placeholder="Seleccionar"
                options={items
                  .filter((item) => item.activo)
                  .map((item) => ({
                    value: String(item.id_insumo),
                    label: `${item.codigo} - ${item.nombre}`,
                  }))}
                value={movementForm.id_insumo}
                onChange={(value) =>
                  setMovementForm((prev) => ({ ...prev, id_insumo: value }))
                }
              />
              <Input
                label="Cantidad"
                badge="required"
                type="number"
                min="1"
                value={movementForm.cantidad}
                onChange={(e) =>
                  setMovementForm((prev) => ({
                    ...prev,
                    cantidad: e.target.value,
                  }))
                }
                hint="Valor positivo"
              />
              <Input
                label="Fecha"
                badge="required"
                type="date"
                value={movementForm.fecha}
                onChange={(e) =>
                  setMovementForm((prev) => ({
                    ...prev,
                    fecha: e.target.value,
                  }))
                }
                hint="Autorrellena con hoy; editable"
              />
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Observaciones{" "}
                  <span
                    style={{
                      fontSize: 10,
                      color: "#888F94",
                      border: "1px solid #D3D7DA",
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    Opcional
                  </span>
                </label>
                <textarea
                  value={movementForm.observaciones}
                  onChange={(e) =>
                    setMovementForm((prev) => ({
                      ...prev,
                      observaciones: e.target.value,
                    }))
                  }
                  placeholder="Motivo, proveedor, procedimiento..."
                  style={{
                    minHeight: 88,
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: "#203F49",
                    background: "#fff",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </SectionBlock>
          <ModalActions>
            <Button
              variant="secondary"
              onClick={() => setMovementModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button loading={saving} onClick={saveMovement}>
              Registrar
            </Button>
          </ModalActions>
        </Modal>
      )}

      <ConfirmModal
        open={Boolean(itemToDelete)}
        title="Eliminar insumo"
        description={`¿Deseas marcar ${
          itemToDelete?.nombre ?? "este insumo"
        } como inactivo? Seguirá apareciendo en la tabla y podrás readmitirlo después.`}
        confirmLabel="Marcar inactivo"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={deleteItem}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const map = {
    primary: { bg: "#E6F8FB", color: "#0BC5DF" },
    success: { bg: "#ECFDF5", color: "#1D9E75" },
    warning: { bg: "#FFFBEB", color: "#EF9F27" },
    danger: { bg: "#FEF2F2", color: "#E24B4A" },
  };
  const selected = map[tone];
  return (
    <Card
      style={{
        padding: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#888F94", marginBottom: 8 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            color: map[tone].color,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: selected.bg,
          color: selected.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginLeft: 12,
        }}
      >
        {icon}
      </div>
    </Card>
  );
}

function CategoryBadge({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Anestesia: { bg: "#E6F8FB", color: "#0899B0" },
    Higiene: { bg: "#ECFDF5", color: "#1D9E75" },
    Materiales: { bg: "#EEF4FF", color: "#4F6FB6" },
    Instrumental: { bg: "#F5F3FF", color: "#7C3AED" },
    Medicamento: { bg: "#FFFBEB", color: "#EF9F27" },
    Otro: { bg: "#F1F3F4", color: "#5F656A" },
  };
  const selected = map[value] ?? map.Otro;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 20,
        background: selected.bg,
        color: selected.color,
      }}
    >
      {value}
    </span>
  );
}

function InventoryStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Normal: { bg: "#ECFDF5", color: "#1D9E75" },
    "Stock bajo": { bg: "#FFFBEB", color: "#EF9F27" },
    Agotado: { bg: "#FEF2F2", color: "#E24B4A" },
  };
  const selected = map[status] ?? map.Normal;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
        background: selected.bg,
        color: selected.color,
      }}
    >
      {status}
    </span>
  );
}

function RecordStatusBadge({ status }: { status: string }) {
  const isActive = status === "Activo";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
        background: isActive ? "#E6F8FB" : "#F1F3F4",
        color: isActive ? "#0899B0" : "#5F656A",
      }}
    >
      {status}
    </span>
  );
}

function InventoryLegend() {
  return (
    <tfoot>
      <tr>
        <td
          colSpan={9}
          style={{
            padding: "12px 14px",
            fontSize: 11,
            color: "#888F94",
            textAlign: "right",
          }}
        >
          <span style={{ color: "#1D9E75" }}>●</span> Normal&nbsp;&nbsp;&nbsp;
          <span style={{ color: "#EF9F27" }}>●</span> Stock
          bajo&nbsp;&nbsp;&nbsp;
          <span style={{ color: "#E24B4A" }}>●</span> Agotado&nbsp;&nbsp;&nbsp;
          <span style={{ color: "#5F656A" }}>●</span> Inactivo
        </td>
      </tr>
    </tfoot>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  isMobile = false,
  maxWidth = 720,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
  isMobile?: boolean;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.58)",
        zIndex: 200,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : maxWidth,
          maxHeight: isMobile ? "92vh" : "92vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: isMobile ? "16px 16px 0 0" : 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
        }}
      >
        <div
          style={{
            padding: isMobile ? "20px 20px 16px" : "24px 32px 18px",
            borderBottom: "1px solid #D3D7DA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#203F49",
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
              }}
            >
              {title}
            </h2>
            <p style={{ margin: "8px 0 0", color: "#888F94", fontSize: 13 }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#888F94",
              cursor: "pointer",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <X size={22} />
          </button>
        </div>
        <div
          style={{
            padding: isMobile ? "20px 20px" : 32,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        borderTop: "1px solid #D3D7DA",
        paddingTop: 20,
      }}
    >
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateItemForm(
  form: ItemFormState
):
  | { ok: true; data: CreateInventoryItemInput }
  | { ok: false; message: string } {
  const stockActual = Number(form.stock_actual);
  const stockMinimo = Number(form.stock_minimo);
  const precioCosto = Number(form.precio_costo);
  if (!form.nombre.trim())
    return { ok: false, message: "El nombre del insumo es obligatorio." };
  if (!form.categoria)
    return { ok: false, message: "La categoría es obligatoria." };
  if (!form.unidad_medida)
    return { ok: false, message: "La unidad de medida es obligatoria." };
  if (!Number.isInteger(stockActual) || stockActual < 0)
    return {
      ok: false,
      message: "El stock actual debe ser un entero mayor o igual a 0.",
    };
  if (!Number.isInteger(stockMinimo) || stockMinimo < 0)
    return {
      ok: false,
      message: "El stock mínimo debe ser un entero mayor o igual a 0.",
    };
  if (!Number.isFinite(precioCosto) || precioCosto <= 0)
    return { ok: false, message: "El precio unitario debe ser mayor a 0." };
  return {
    ok: true,
    data: {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      unidad_medida: form.unidad_medida,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      precio_costo: Math.round(precioCosto * 100) / 100,
    },
  };
}

function validateMovementForm(
  form: MovementFormState
):
  | { ok: true; data: CreateInventoryMovementInput }
  | { ok: false; message: string } {
  const cantidad = Number(form.cantidad);
  const idInsumo = Number(form.id_insumo);
  if (!form.tipo)
    return { ok: false, message: "Selecciona el tipo de movimiento." };
  if (!Number.isInteger(idInsumo) || idInsumo <= 0)
    return { ok: false, message: "Selecciona un producto." };
  if (!Number.isInteger(cantidad) || cantidad <= 0)
    return { ok: false, message: "La cantidad debe ser un entero mayor a 0." };
  if (!form.fecha) return { ok: false, message: "La fecha es obligatoria." };
  return {
    ok: true,
    data: {
      tipo: form.tipo,
      id_insumo: idInsumo,
      cantidad,
      fecha: form.fecha,
      observaciones: form.observaciones.trim() || undefined,
    },
  };
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error)
    return String((error as { message: string }).message);
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

function exportInventoryCsv(items: InventoryItem[]) {
  const header = [
    "Código",
    "Nombre",
    "Categoría",
    "Unidad",
    "Stock actual",
    "Stock mínimo",
    "Precio costo",
    "Estado stock",
    "Estado registro",
  ];
  const rows = items.map((item) => [
    item.codigo,
    item.nombre,
    item.categoria,
    item.unidad_medida,
    item.stock_actual,
    item.stock_minimo,
    item.precio_costo,
    item.estado,
    item.estado_registro,
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `inventario-${todayInputValue()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
