import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './UIKit';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
    key: string;
    label: string;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterDef {
    key: string;
    placeholder: string;
    options: { value: string; label: string }[];
}

export interface RowAction<T> {
    icon: React.ReactNode;
    label?: string;
    onClick: (row: T) => void;
    danger?: boolean;
}

export interface DataTableProps<T extends Record<string, unknown>> {
    columns: Column<T>[];
    data: T[];
    title?: string;
    description?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[];
    filters?: FilterDef[];
    pageSize?: number;
    primaryAction?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
    };
    secondaryActions?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
    }[];
    rowActions?: (row: T) => RowAction<T>[];
    getRowKey?: (row: T, index: number) => string;
    style?: React.CSSProperties;
    emptyMessage?: string;
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

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, height: 36, padding: '0 13px', borderRadius: 10,
                    background: '#F8F9FA', border: '1px solid transparent',
                    fontSize: 14, color: value ? '#203F49' : '#888F94',
                    cursor: 'pointer', minWidth: 160, fontWeight: 500,
                }}
            >
                <span>{selected ? selected.label : placeholder}</span>
                <ChevronDown size={16} style={{ color: '#888F94', opacity: 0.5 }} />
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20,
                    background: '#fff', border: '1px solid #D3D7DA', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '100%', overflow: 'hidden',
                }}>
                    <div
                        style={{ padding: '8px 13px', fontSize: 13, color: '#888F94', cursor: 'pointer' }}
                        onClick={() => { onChange(''); setOpen(false); }}
                    >
                        {placeholder}
                    </div>
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            style={{
                                padding: '8px 13px', fontSize: 13, color: '#203F49', cursor: 'pointer',
                                background: value === opt.value ? '#E6F8FB' : 'transparent',
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

    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #E8EBED' }}>
            <span style={{ fontSize: 13, color: '#888F94' }}>
                {total === 0 ? 'Sin resultados' : `${from}–${to} de ${total}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                    disabled={page === 1}
                    onClick={() => onPage(page - 1)}
                    style={{
                        width: 32, height: 32, border: '1px solid #D3D7DA', borderRadius: 6,
                        background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: page === 1 ? 0.4 : 1,
                    }}
                >
                    <ChevronLeft size={14} color="#203F49" />
                </button>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} style={{ width: 32, textAlign: 'center', fontSize: 13, color: '#888F94' }}>…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPage(p as number)}
                            style={{
                                width: 32, height: 32, border: '1px solid',
                                borderColor: page === p ? '#0BC5DF' : '#D3D7DA',
                                borderRadius: 6, cursor: 'pointer',
                                background: page === p ? '#0BC5DF' : '#fff',
                                color: page === p ? '#fff' : '#203F49',
                                fontSize: 13, fontWeight: page === p ? 600 : 400,
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
                        width: 32, height: 32, border: '1px solid #D3D7DA', borderRadius: 6,
                        background: '#fff', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: (page === totalPages || totalPages === 0) ? 0.4 : 1,
                    }}
                >
                    <ChevronRight size={14} color="#203F49" />
                </button>
            </div>
        </div>
    );
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    title,
    description,
    searchable = true,
    searchPlaceholder = 'Buscar...',
    searchKeys,
    filters = [],
    pageSize = 10,
    primaryAction,
    secondaryActions = [],
    rowActions,
    getRowKey,
    style,
    emptyMessage = 'No hay registros.',
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let rows = data;

        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter((row) => {
                const keys = searchKeys ?? (Object.keys(row) as (keyof T)[]);
                return keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q));
            });
        }

        filters.forEach(({ key }) => {
            const val = filterValues[key];
            if (val) rows = rows.filter((row) => String(row[key] ?? '') === val);
        });

        return rows;
    }, [data, search, filterValues, filters, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSearch = (q: string) => {
        setSearch(q);
        setPage(1);
    };

    const handleFilter = (key: string, val: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: val }));
        setPage(1);
    };

    return (
        <div style={{
            background: '#fff', border: '1px solid #D3D7DA', borderRadius: 16,
            overflow: 'hidden', ...style
        }}>
            {/* Card header */}
            {(title || primaryAction) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px',
                }}>
                    {title && (
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 500, color: '#203F49' }}>{title}</div>
                            {description && <div style={{ fontSize: 14, color: '#888F94', marginTop: 2 }}>{description}</div>}
                        </div>
                    )}
                    {primaryAction && (
                        <Button variant="primary" size="sm" onClick={primaryAction.onClick} style={{ gap: 8, borderRadius: 10 }}>
                            {primaryAction.icon}
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            )}

            {/* Filters row */}
            {(searchable || filters.length > 0 || secondaryActions.length > 0) && (
                <div style={{ padding: '0 24px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {searchable && (
                        <div style={{ position: 'relative', flex: '0 0 266px' }}>
                            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#888F94', pointerEvents: 'none' }} />
                            <input
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                style={{
                                    width: '100%', height: 36, paddingLeft: 36, paddingRight: 12,
                                    border: 'none', borderRadius: 10, background: '#F8F9FA',
                                    fontSize: 14, color: '#203F49', outline: 'none',
                                }}
                            />
                        </div>
                    )}
                    {filters.map((f) => (
                        <FilterDropdown
                            key={f.key}
                            placeholder={f.placeholder}
                            options={f.options}
                            value={filterValues[f.key] ?? ''}
                            onChange={(v) => handleFilter(f.key, v)}
                        />
                    ))}
                    {secondaryActions.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                            {secondaryActions.map((a, i) => (
                                <Button key={i} variant="secondary" size="sm" onClick={a.onClick} style={{ gap: 6, borderRadius: 10, height: 32 }}>
                                    {a.icon}
                                    {a.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div style={{ borderTop: '1px solid #D3D7DA', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #D3D7DA' }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        padding: '10px 8px',
                                        textAlign: (col.align ?? 'left') as React.CSSProperties['textAlign'],
                                        fontSize: 11, fontWeight: 600, color: '#888F94',
                                        letterSpacing: '0.66px', textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                        width: col.width,
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {rowActions && (
                                <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888F94', letterSpacing: '0.66px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (rowActions ? 1 : 0)}
                                    style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#888F94' }}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paged.map((row, idx) => {
                                const key = getRowKey ? getRowKey(row, idx) : String(idx);
                                const actions = rowActions?.(row) ?? [];
                                return (
                                    <tr
                                        key={key}
                                        style={{ borderBottom: '1px solid #F1F3F4', background: idx % 2 === 0 ? '#fff' : '#FAFBFB' }}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                style={{
                                                    padding: '13px 8px',
                                                    fontSize: 13, color: '#203F49',
                                                    textAlign: (col.align ?? 'left') as React.CSSProperties['textAlign'],
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {col.render
                                                    ? col.render(row[col.key], row)
                                                    : String(row[col.key] ?? '')}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                    {actions.map((action, ai) => (
                                                        <button
                                                            key={ai}
                                                            title={action.label}
                                                            onClick={() => action.onClick(row)}
                                                            style={{
                                                                width: 32, height: 32, borderRadius: 10,
                                                                border: 'none', background: 'transparent',
                                                                cursor: 'pointer', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                color: action.danger ? '#E24B4A' : '#203F49',
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
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={pageSize}
                onPage={setPage}
            />
        </div>
    );
}

// ── FormSection ───────────────────────────────────────────────────────────────

export interface FormSectionProps {
    icon?: React.ReactNode;
    title: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    columns?: 1 | 2 | 3;
}

export function FormSection({ icon, title, children, style, columns = 2 }: FormSectionProps) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #D3D7DA', borderRadius: 14,
            padding: 25, ...style
        }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                {icon && (
                    <span style={{ color: '#0BC5DF', display: 'flex', flexShrink: 0 }}>{icon}</span>
                )}
                <span style={{ fontSize: 16, fontWeight: 600, color: '#203F49' }}>{title}</span>
            </div>

            {/* Fields grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 16,
            }}>
                {children}
            </div>
        </div>
    );
}

// ── FullWidthField helper ─────────────────────────────────────────────────────
// Spans all columns inside a FormSection grid

export function FullWidthField({ children }: { children: React.ReactNode }) {
    return <div style={{ gridColumn: '1 / -1' }}>{children}</div>;
}
