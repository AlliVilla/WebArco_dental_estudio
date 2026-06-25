import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "../context";
import { matchesNormalizedSearch } from "../utils/formatters";
import { useResponsive } from "../hooks/useWindowWidth";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterDef {
  key: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}

export interface RowAction<T> {
  icon: React.ReactNode;
  label?: string;
  onClick: (row: T) => void;
  danger?: boolean;
}

export interface DataTableActionContext<T> {
  filteredData: T[];
  pagedData: T[];
  search: string;
  filters: Record<string, string>;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  description?: string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: FilterDef[];
  filterExtra?: React.ReactNode;
  pageSize?: number;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (context: DataTableActionContext<T>) => void;
  }[];
  rowActions?: (row: T) => RowAction<T>[];
  getRowKey?: (row: T, index: number) => string;
  style?: React.CSSProperties;
  emptyMessage?: string;
  footer?: React.ReactNode;
  hidePagination?: boolean;
  onSearchChange?: (value: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isServerSide?: boolean;
  totalRecords?: number;
  onServerParamsChange?: (params: {
    page: number;
    search: string;
    filters: Record<string, string>;
  }) => void;
  /**
   * Si se provee, en mobile/tablet se renderiza una card por fila usando esta
   * función en lugar de la tabla nativa. La tabla en desktop no cambia.
   */
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}

// ── FilterDropdown ────────────────────────────────────────────────────────────

function FilterDropdown({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          height: 40,
          padding: "0 16px",
          borderRadius: 8,
          background: "#fff",
          border: "1px solid #E4E7EC",
          fontSize: 12,
          color: value ? "#203F49" : "#6C757D",
          cursor: "pointer",
          minWidth: 120,
          maxWidth: "100%",
          fontWeight: 400,
          boxSizing: "border-box",
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} style={{ color: "#8A9499" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 30,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            minWidth: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              fontSize: 12,
              color: "#8A9499",
              cursor: "pointer",
              background: "#F8F9FA",
            }}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: "10px 16px",
                fontSize: 12,
                color: "#203F49",
                cursor: "pointer",
                background: value === opt.value ? "#EBFBFC" : "transparent",
                fontWeight: value === opt.value ? 500 : 400,
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 8px 10px 8px",
        marginTop: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "#667085", fontWeight: 400 }}>
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${from}–${to} de ${total} registros`}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          style={{
            width: 32,
            height: 32,
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            background: "#fff",
            cursor: page === 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: page === 1 ? 0.4 : 1,
            transition: "all 0.2s",
          }}
        >
          <ChevronLeft size={16} color="#4A5568" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                width: 32,
                textAlign: "center",
                fontSize: 12,
                color: "#667085",
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={{
                width: 32,
                height: 32,
                border: "1px solid",
                borderColor: page === p ? "#22C7E8" : "#E2E8F0",
                borderRadius: 6,
                cursor: "pointer",
                background: page === p ? "#22C7E8" : "#fff",
                color: page === p ? "#fff" : "#4A5568",
                fontSize: 12,
                fontWeight: page === p ? 600 : 400,
                transition: "all 0.2s",
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onPage(page + 1)}
          style={{
            width: 32,
            height: 32,
            border: "1px solid #E2E8F0",
            borderRadius: 6,
            background: "#fff",
            cursor:
              page === totalPages || totalPages === 0
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: page === totalPages || totalPages === 0 ? 0.4 : 1,
            transition: "all 0.2s",
          }}
        >
          <ChevronRight size={16} color="#4A5568" />
        </button>
      </div>
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  title,
  description,
  searchable = true,
  searchPlaceholder = "Buscar...",
  searchKeys,
  filters = [],
  filterExtra,
  pageSize = 10,
  primaryAction,
  secondaryActions = [],
  rowActions,
  getRowKey,
  style,
  emptyMessage = "No hay registros disponibles.",
  footer,
  hidePagination = false,
  isServerSide = false,
  totalRecords = 0,
  onServerParamsChange,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
  renderMobileCard,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [internalPage, setInternalPage] = useState(1);
  const { isMobile, isTablet } = useResponsive();

  const activePage = page ?? internalPage;
  const setActivePage = onPageChange ?? setInternalPage;
  const showCards = Boolean(renderMobileCard) && (isMobile || isTablet);

  useEffect(() => {
    if (isServerSide && onServerParamsChange) {
      onServerParamsChange({ page: activePage, search, filters: filterValues });
    }
  }, [activePage, search, filterValues, isServerSide, onServerParamsChange]);

  const filteredData = useMemo(() => {
    if (isServerSide) return data;
    let rows = data;

    if (search) {
      rows = rows.filter((row) => {
        const r = row as Record<string, any>;
        const keys = searchKeys ?? (Object.keys(r) as (keyof T)[]);
        const searchableText = keys.map((k) => String(r[k as string] ?? "")).join(" ");
        return matchesNormalizedSearch(searchableText, search);
      });
    }

    filters.forEach(({ key }) => {
      const val = filterValues[key];
      if (val) rows = rows.filter((row) => String((row as Record<string, any>)[key] ?? "") === val);
    });

    return rows;
  }, [data, search, filterValues, filters, searchKeys, isServerSide]);

  const totalCount = isServerSide ? totalRecords : filteredData.length;
  const computedTotalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const displayTotalPages = totalPages ?? computedTotalPages;
  const safePage = Math.min(activePage, computedTotalPages);

  const pagedData = useMemo(() => {
    if (isServerSide) return data;
    return filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);
  }, [filteredData, safePage, pageSize, isServerSide, data]);

  const handleSearch = (q: string) => {
    setSearch(q);
    setActivePage(1);
    onSearchChange?.(q);
  };

  const handleFilter = (key: string, val: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: val }));
    setActivePage(1);
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        width: "100%",
        borderRadius: 12,
        border: "1px solid #E4E7EC",
        padding: "16px",
        boxSizing: "border-box",
        boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
        ...style,
      }}
    >
      {/* 1. Header principal */}
      {(title || primaryAction) && (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: isMobile ? 12 : 16,
            padding: "0 0 18px 0",
          }}
        >
          {title && (
            <div>
              <div style={{ fontSize: 19, fontWeight: 600, color: "#202734" }}>
                {title}
              </div>
              {description && (
                <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                  {description}
                </div>
              )}
            </div>
          )}
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
              fullWidth={isMobile}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* 2. Barra de Filtros y Acciones Secundarias */}
      {(searchable || filters.length > 0 || secondaryActions.length > 0) && (
        <div
          style={{
            padding: "0 0 14px 0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Fila 1: búsqueda + acciones secundarias */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {searchable && (
              <div
                style={{ position: "relative", flex: "1 1 180px", minWidth: 0 }}
              >
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#98A2B3",
                    pointerEvents: "none",
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    width: "100%",
                    height: 40,
                    paddingLeft: 36,
                    paddingRight: 16,
                    border: "1px solid #E4E7EC",
                    borderRadius: 8,
                    background: "#F5F7FA",
                    fontSize: 12,
                    color: "#1A202C",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {secondaryActions.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  flexShrink: 0,
                }}
              >
                {secondaryActions.map((a, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      a.onClick({
                        filteredData,
                        pagedData,
                        search,
                        filters: filterValues,
                      })
                    }
                  >
                    {a.icon}
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Fila 2: filtros (se envuelven solos) */}
          {(filters.length > 0 || filterExtra) && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {filters.map((f) => (
                <FilterDropdown
                  key={f.key}
                  placeholder={f.placeholder}
                  options={f.options}
                  value={filterValues[f.key] ?? ""}
                  onChange={(v) => handleFilter(f.key, v)}
                />
              ))}
              {Object.values(filterValues).some((v) => v !== "") && (
                <button
                  onClick={() => {
                    setFilterValues({});
                    setActivePage(1);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    background: "#fff",
                    border: "1px solid #E4E7EC",
                    fontSize: 12,
                    color: "#6C757D",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                  }}
                >
                  <X size={14} style={{ color: "#8A9499" }} /> Limpiar
                </button>
              )}
              {filterExtra}
            </div>
          )}
        </div>
      )}

      {/* 3a. Vista de cards (solo mobile/tablet, cuando se provee renderMobileCard) */}
      {showCards && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pagedData.length === 0 ? (
            <div
              style={{
                padding: "48px 16px",
                textAlign: "center",
                fontSize: 12,
                color: "#A0AEC0",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                background: "#FFFFFF",
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            pagedData.map((row, idx) => {
              const key = getRowKey ? getRowKey(row, idx) : String(idx);
              return (
                <React.Fragment key={key}>
                  {renderMobileCard!(row, idx)}
                </React.Fragment>
              );
            })
          )}
        </div>
      )}

      {/* 3b. El contenedor nativo de la Tabla (oculto si se muestran cards) */}
      {!showCards && (
        <div
          style={{
            border: "1px solid #D3D7DA",
            borderRadius: 8,
            overflow: "hidden",
            background: "#FFFFFF",
            boxShadow: "none",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr style={{ background: "#F7F8FA" }}>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        padding: "10px 14px",
                        textAlign: (col.align ??
                          "left") as React.CSSProperties["textAlign"],
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#4F5B62",
                        whiteSpace: "nowrap",
                        width: col.width,
                        borderBottom: "1px solid #D3D7DA",
                        height: 45,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                  {rowActions && (
                    <th
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#4F5B62",
                        whiteSpace: "nowrap",
                        width: 100,
                        borderBottom: "1px solid #D3D7DA",
                        height: 42,
                      }}
                    >
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pagedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (rowActions ? 1 : 0)}
                      style={{
                        padding: "48px 16px",
                        textAlign: "center",
                        fontSize: 12,
                        color: "#A0AEC0",
                      }}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, idx) => {
                    const key = getRowKey ? getRowKey(row, idx) : String(idx);
                    const actions = rowActions?.(row) ?? [];
                    return (
                      <tr
                        key={key}
                        style={{
                          background: "#fff",
                          height: 46,
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F9FAFB";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#fff";
                        }}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            style={{
                              padding: "11px 14px",
                              fontSize: 12,
                              color: "#475467",
                              textAlign: (col.align ??
                                "left") as React.CSSProperties["textAlign"],
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #D3D7DA",
                            }}
                          >
                            {col.render
                              ? col.render((row as Record<string, any>)[col.key], row)
                              : String((row as Record<string, any>)[col.key] ?? "")}
                          </td>
                        ))}
                        {rowActions && (
                          <td
                            style={{
                              padding: "8px 14px",
                              textAlign: "center",
                              borderBottom: "1px solid #F0F2F5",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {actions.map((action, ai) => (
                                <button
                                  key={ai}
                                  title={action.label}
                                  onClick={() => action.onClick(row)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: action.danger
                                      ? "#F04438"
                                      : "#667085",
                                    padding: 2,
                                    transition: "color 0.2s",
                                  }}
                                >
                                  {action.icon}
                                </button>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {footer}
            </table>
          </div>
        </div>
      )}

      {/* 4. Paginación */}
      {!hidePagination && (
        <Pagination
          page={safePage}
          totalPages={displayTotalPages}
          total={totalCount}
          pageSize={pageSize}
          onPage={setActivePage}
        />
      )}
    </div>
  );
}
