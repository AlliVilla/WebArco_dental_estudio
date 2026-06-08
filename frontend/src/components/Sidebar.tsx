import React from 'react';
import svgPaths from '../imports/Sidebar/svg-zii4vktzzu';
import logoImg from '../imports/Sidebar/ca39f86fb9c6356ff8dfa2e45f720cb62c3b2221.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Nav data (SVG paths wired from Figma import) ──────────────────────────────

interface NavSubItem {
  id: string;
  label: string;
}

interface NavItem {
  id: string;
  label: string;
  badge?: number;
  icon: React.ReactNode;
  subItems?: NavSubItem[];
}
interface NavGroup { title: string; items: NavItem[] }

function IconDashboard() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p22c26800} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p190ace00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p3e1c2280} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p185b9d00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconAgenda() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d="M5.66667 1.41667V4.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M11.3333 1.41667V4.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p2cd22c80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M2.125 7.08333H14.875" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconPacientes() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p2db2b980} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p8f9d130} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p10158180} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p30dc5600} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

export function IconOdontograma() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d="M7.79167 1.41667V2.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M3.54167 1.41667V2.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p3f59ec00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p11ddd600} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.pb765300} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

export function IconHistoria() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p3b032380} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p150df980} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M7.08333 6.375H5.66667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M11.3333 9.20833H5.66667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M11.3333 12.0417H5.66667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconTratamientos() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p3c31b700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p11428e80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M8.5 7.79167H11.3333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M8.5 11.3333H11.3333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M5.66667 7.79167H5.67375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M5.66667 11.3333H5.67375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconFacturacion() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p3ad98600} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M1.41667 7.08333H15.5833" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconInventario() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p9e33f70} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M8.5 15.5833V8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p1ac8a500} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p33f48880} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconEstadisticas() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d="M12.75 14.1667V7.08333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M8.5 14.1667V2.83333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d="M4.25 14.1667V9.91667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="block" fill="none" viewBox="0 0 17 17" width={17} height={17}>
      <path d={svgPaths.p4b61000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
      <path d={svgPaths.p27765100} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.41667" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="block" fill="none" viewBox="0 0 15 15" width={15} height={15}>
      <path d={svgPaths.p2921ce00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.pa80d080} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M13.125 7.5H5.625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
      { id: 'agenda', label: 'Agenda', badge: 3, icon: <IconAgenda /> },
    ],
  },
  {
    title: 'Pacientes',
    items: [
      {
        id: 'patients',
        label: 'Pacientes',
        icon: <IconPacientes />,
        subItems: [
          { id: 'patients-list', label: 'Registro de Pacientes' },
          { id: 'patients-odontogram', label: 'Odontograma' },
          { id: 'patients-records', label: 'Historia Clínica' },
        ],
      },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { id: 'treatments', label: 'Tratamientos', icon: <IconTratamientos /> },
      {
        id: 'billing',
        label: 'Facturación',
        icon: <IconFacturacion />,
        subItems: [
          { id: 'billing-income', label: 'Gestión de Ingresos' },
          { id: 'billing-expense', label: 'Gestión de Egresos' },
          { id: 'billing-list', label: 'Lista de Ingreso / Egreso' },
          { id: 'billing-closures', label: 'Cierres' },
        ],
      },
      { id: 'inventory', label: 'Inventario', icon: <IconInventario /> },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { id: 'stats', label: 'Estadísticas', icon: <IconEstadisticas /> },
    ],
  },
];

// ── Sidebar component ─────────────────────────────────────────────────────────

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeItem, onNavigate, collapsed, onToggle }: SidebarProps) {
  const w = collapsed ? 64 : 240;

  return (
    <>
      <aside
        style={{
          width: w,
          minWidth: w,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          background: '#fff',
          borderRight: '1.067px solid #D3D7DA',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Logo ── */}
        <div style={{
          borderBottom: '1.067px solid #fff',
          padding: collapsed ? '14px 0' : '16px 16px 13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
          transition: 'padding 0.22s',
        }}>
          <div style={{
            height: 41,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            width: collapsed ? 40 : 210,
            transition: 'width 0.22s',
          }}>
            <ImageWithFallback
              src={logoImg}
              alt="ARCO Dental Studio"
              style={{
                width: collapsed ? 40 : 63,
                height: collapsed ? 40 : 62,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          padding: 12,
        }}>
          {navGroups.map((group) => (
            <div key={group.title} style={{ marginBottom: 0 }}>
              {/* Section title */}
              {!collapsed && (
                <div style={{ padding: '20px 8px 0' }}>
                  <p style={{
                    fontSize: 10, fontWeight: 600, color: '#888F94',
                    letterSpacing: '0.8px', textTransform: 'uppercase',
                    lineHeight: '15px', whiteSpace: 'nowrap',
                  }}>
                    {group.title}
                  </p>
                </div>
              )}
              {collapsed && <div style={{ height: 16 }} />}

              {/* Nav items */}
              {group.items.map((item, i) => {
                const isSubActive = item.subItems && item.subItems.some(sub => activeItem === sub.id);
                const isActive = activeItem === item.id || !!isSubActive;
                const isExpanded = isActive;
                return (
                  <div
                    key={item.id}
                    style={{ paddingTop: i === 0 ? 4 : 1 }}
                  >
                    <button
                      onClick={() => onNavigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 10,
                        padding: collapsed ? '9px 0' : '9px 12px',
                        paddingLeft: collapsed ? 0 : isActive ? 14.133 : 14.133,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: isActive ? '#E6F8FB' : 'transparent',
                        color: isActive ? '#203F49' : '#5F656A',
                        fontSize: 14,
                        fontWeight: isActive ? 500 : 400,
                        textAlign: 'left',
                        position: 'relative',
                        transition: 'background 0.13s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#F8F9FA';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      {/* Active left border */}
                      <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: isActive ? 2.133 : 2.133,
                        borderRadius: 8,
                        background: isActive ? '#0BC5DF' : 'transparent',
                        transition: 'background 0.13s',
                      }} />

                      {/* Icon */}
                      <span style={{
                        color: isActive ? '#0BC5DF' : '#888F94',
                        flexShrink: 0,
                        display: 'flex',
                        transition: 'color 0.13s',
                      }}>
                        {item.icon}
                      </span>

                      {/* Label */}
                      {!collapsed && (
                        <span style={{
                          flex: 1,
                          overflow: 'hidden',
                          lineHeight: '21px',
                        }}>
                          {item.label}
                        </span>
                      )}

                      {/* Badge */}
                      {item.badge && !collapsed && (
                        <span style={{
                          background: '#0BC5DF', color: '#fff',
                          fontSize: 10, fontWeight: 600,
                          borderRadius: 10, padding: '1px 6px',
                          minWidth: 18, textAlign: 'center',
                          lineHeight: '15px',
                        }}>
                          {item.badge}
                        </span>
                      )}
                      {item.badge && collapsed && (
                        <span style={{
                          position: 'absolute', top: 7, right: 8,
                          width: 7, height: 7, borderRadius: '50%',
                          background: '#0BC5DF', border: '1.5px solid #fff',
                        }} />
                      )}
                    </button>

                    {/* Render sub-items if expanded and not collapsed */}
                    {item.subItems && isExpanded && !collapsed && (
                      <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, marginBottom: 4 }}>
                        {item.subItems.map(sub => {
                          const isCurrentSubActive = activeItem === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => onNavigate(sub.id)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                background: isCurrentSubActive ? '#E6F8FB' : 'transparent',
                                color: isCurrentSubActive ? '#0BC5DF' : '#5F656A',
                                fontSize: 13,
                                fontWeight: isCurrentSubActive ? 500 : 400,
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onMouseEnter={(e) => {
                                if (!isCurrentSubActive) (e.currentTarget as HTMLButtonElement).style.background = '#F8F9FA';
                              }}
                              onMouseLeave={(e) => {
                                if (!isCurrentSubActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              }}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Settings ── */}
        <div style={{ borderTop: '1.067px solid #D3D7DA', padding: '9px 12px 8px', flexShrink: 0 }}>
          <button
            onClick={() => onNavigate('settings')}
            title={collapsed ? 'Configuración' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, padding: '9px 12px', borderRadius: 8,
              border: 'none', cursor: 'pointer', background: 'transparent',
              color: '#5F656A', fontSize: 14, fontWeight: 400,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8F9FA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span style={{ color: '#888F94', display: 'flex', flexShrink: 0 }}><IconSettings /></span>
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Configuración</span>}
          </button>
        </div>

        {/* ── User profile ── */}
        <div style={{ borderTop: '1.067px solid #D3D7DA', padding: '13px 16px 12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#0BC5DF', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: '#fff',
            }}>KA</div>

            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 500, color: '#203F49',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    lineHeight: '19.5px',
                  }}>Dr. Karla Arita</p>
                  <p style={{ fontSize: 11, color: '#888F94', lineHeight: '16.5px' }}>Administradora</p>
                </div>
                <button style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, color: '#888F94', display: 'flex', flexShrink: 0,
                }}>
                  <IconLogout />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Collapse toggle tab ── */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        style={{
          position: 'fixed',
          top: '50%',
          left: w,
          transform: 'translateY(-50%)',
          zIndex: 60,
          width: 16,
          height: 48,
          borderRadius: '0 6px 6px 0',
          background: '#0BC5DF',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), background 0.15s',
          color: '#fff',
          padding: 0,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0899B0'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0BC5DF'; }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </>
  );
}
