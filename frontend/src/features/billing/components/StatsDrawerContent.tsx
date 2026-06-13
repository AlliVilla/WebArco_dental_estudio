import { StatsDrawer, StatsDrawerProps } from "../../../components/StatsDrawer";

export interface StatsItem {
  nombre: string;
  categoría: string;
  monto: number;
  estado: "Pagado" | "Pendiente" | "Parcial";
}

export interface StatsDrawerContentProps extends Omit<
  StatsDrawerProps,
  "children"
> {
  icon?: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  iconColor?: string;
  totalValue?: string;
  items: StatsItem[];
}

export function StatsDrawerContent({
  open,
  title,
  subtitle,
  onClose,
  icon: IconComponent,
  iconColor,
  totalValue,
  items,
}: StatsDrawerContentProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Pagado":
        return { bg: "#ECFDF5", text: "#10B981" };
      case "Pendiente":
        return { bg: "#FEF3C7", text: "#EF9F27" };
      case "Parcial":
        return { bg: "#DBEAFE", text: "#0BC5DF" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  return (
    <StatsDrawer
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {IconComponent && iconColor && totalValue && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              background: "#F8F9FA",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: iconColor + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconComponent size={24} style={{ color: iconColor }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#888F94", margin: 0 }}>
                {title}
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: iconColor,
                  margin: "4px 0 0 0",
                }}
              >
                {totalValue}
              </p>
            </div>
          </div>
        )}

        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#888F94",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: "0 0 12px 0",
            }}
          >
            {subtitle}
          </h4>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: "60vh",
              overflowY: "auto",
              paddingRight: 8,
            }}
          >
            {items.length > 0 ? (
              items.map((item, index) => {
                const estadoColor = getEstadoColor(item.estado);
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      background: "#F8F9FA",
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#203F49",
                          margin: "0 0 2px 0",
                        }}
                      >
                        {item.nombre}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888F94",
                          margin: 0,
                        }}
                      >
                        {item.categoría}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: iconColor || "#203F49",
                          margin: 0,
                        }}
                      >
                        L.{" "}
                        {item.monto.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <div
                        style={{
                          background: estadoColor.bg,
                          color: estadoColor.text,
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {item.estado}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#888F94",
                }}
              >
                <p style={{ margin: 0, fontSize: 14 }}>
                  No hay registros disponibles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StatsDrawer>
  );
}
