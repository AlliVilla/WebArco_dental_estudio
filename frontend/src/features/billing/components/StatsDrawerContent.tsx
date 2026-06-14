import { StatsDrawer, StatsDrawerProps } from "../../../components/StatsDrawer";

export interface StatsItem {
  nombre: string;
  categoría: string;
  monto: number;
  fecha?: string;
  responsable?: string;
  observaciones?: string;
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
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
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
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 16,
                      background: "#FFFFFF",
                      borderRadius: 12,
                      border: "1px solid #EAECEE",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#203F49",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {item.nombre}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#0BC5DF",
                              background: "#E6F8FB",
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {item.categoría}
                          </span>
                          {item.fecha && (
                            <span style={{ fontSize: 12, color: "#888F94" }}>
                              • {formatDate(item.fecha)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: 16,
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
                    </div>
                    
                    {(item.responsable || item.observaciones) && (
                      <div
                        style={{
                          borderTop: "1px dashed #EAECEE",
                          paddingTop: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {item.responsable && (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#5F656A" }}>
                              Responsable:
                            </span>
                            <span style={{ fontSize: 12, color: "#203F49" }}>
                              {item.responsable}
                            </span>
                          </div>
                        )}
                        {item.observaciones && (
                          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#5F656A", minWidth: 85 }}>
                              Observaciones:
                            </span>
                            <span style={{ fontSize: 12, color: "#5F656A", fontStyle: "italic", lineHeight: 1.4 }}>
                              {item.observaciones}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
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
