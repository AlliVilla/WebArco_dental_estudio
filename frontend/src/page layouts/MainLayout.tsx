import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const screenConfig: Record<string, { title: string; breadcrumbs: string[] }> = {
  dashboard: { title: 'Dashboard', breadcrumbs: ['Inicio', 'Dashboard'] },
  'mi-perfil': { title: 'Mi Perfil', breadcrumbs: ['Inicio', 'Perfil'] },
  agenda: { title: 'Agenda', breadcrumbs: ['Inicio', 'Agenda'] },
  'agenda-new': { title: 'Nueva Cita', breadcrumbs: ['Agenda', 'Nueva Cita'] },
  'agenda-detail': { title: 'Detalle de Cita', breadcrumbs: ['Agenda', 'Detalle'] },
  'agenda-edit': { title: 'Editar Cita', breadcrumbs: ['Agenda', 'Editar Cita'] },
  patients: { title: 'Pacientes', breadcrumbs: ['Inicio', 'Pacientes'] },
  'patients-list': { title: 'Registro de Pacientes', breadcrumbs: ['Pacientes', 'Registro'] },
  'patient-expediente': { title: 'Expedientes Clínicos', breadcrumbs: ['Pacientes', 'Expedientes'] },
  odontogram: { title: 'Odontograma', breadcrumbs: ['Pacientes', 'Odontograma'] },
  'consentimientos-lista': { title: 'Consentimientos Informados', breadcrumbs: ['Pacientes', 'Consentimientos'] },
  citas: { title: 'Control de Citas', breadcrumbs: ['Agenda', 'Citas'] },
  recordatorios: { title: 'Recordatorios', breadcrumbs: ['Agenda', 'Recordatorios'] },
  billing: { title: 'Gestión Financiera', breadcrumbs: ['Gestión', 'Facturación'] },
  'billing-income': { title: 'Gestión de Ingresos', breadcrumbs: ['Gestión', 'Facturación', 'Ingresos'] },
  'billing-expense': { title: 'Gestión de Egresos', breadcrumbs: ['Gestión', 'Facturación', 'Egresos'] },
  'billing-closures': { title: 'Cierres de Caja', breadcrumbs: ['Gestión', 'Facturación', 'Cierres'] },
  'billing-list': { title: 'Lista Financiera', breadcrumbs: ['Gestión', 'Facturación', 'Listado'] },
  'estado-resultado': { title: 'Estado de Resultado', breadcrumbs: ['Reportes', 'Estado de Resultado'] },
  users: { title: 'Gestión de Usuarios', breadcrumbs: ['Configuración', 'Usuarios'] },
  treatments: { title: 'Catálogo de Tratamientos', breadcrumbs: ['Configuración', 'Tratamientos'] },
  inventory: { title: 'Control de Inventario', breadcrumbs: ['Configuración', 'Inventario'] },
  settings: { title: 'Configuración', breadcrumbs: ['Inicio', 'Configuración'] },
  design: { title: 'Sistema de Diseño UI Kit', breadcrumbs: ['Inicio', 'Sistema de Diseño'] },
};

export const MainLayout: React.FC<MainLayoutProps> = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (pathname: string) => {
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
    if (pathname === '/mi-perfil') return 'mi-perfil';
    if (pathname === '/recordatorios') return 'recordatorios';
    if (pathname === '/agenda/new') return 'agenda-new';
    if (pathname.startsWith('/agenda/') && pathname.endsWith('/edit')) return 'agenda-edit';
    if (pathname.startsWith('/agenda/') && pathname !== '/agenda/new') return 'agenda-detail';
    if (pathname === '/agenda' || pathname === '/appointments') return 'citas'; // keep sidebar active
    if (pathname === '/patients') return 'patients';
    if (pathname === '/patients/list') return 'patients-list';
    if (pathname === '/patients/odontogram') return 'odontogram';
    if (pathname === '/patients/records') return 'patient-expediente';
    if (pathname === '/patients/consent') return 'consentimientos-lista';
    if (pathname === '/treatments') return 'treatments';
    if (pathname === '/billing/income') return 'billing-income';
    if (pathname === '/billing/expense') return 'billing-expense';
    if (pathname === '/billing/list' || pathname.startsWith('/billing/list/')) return 'billing-list';
    if (pathname === '/billing/closures') return 'billing-closures';
    if (pathname === '/inventory') return 'inventory';
    if (pathname === '/stats') return 'estado-resultado';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/users') return 'users';
    if (pathname === '/design') return 'design';
    return pathname.substring(1);
  };

  const activeTab = getActiveTab(location.pathname);
  const config = screenConfig[activeTab] || { title: activeTab, breadcrumbs: [] };

  const handleNavigate = (tabId: string) => {
    const routeMap: Record<string, string> = {
      dashboard: '/dashboard',
      'mi-perfil': '/settings', // Mapped to settings placeholder
      citas: '/agenda',
      recordatorios: '/agenda', // Mapped to agenda placeholder
      patients: '/patients/list',
      'patients-list': '/patients/list',
      odontogram: '/patients/odontogram',
      'patient-expediente': '/patients/records',
      'consentimientos-lista': '/patients/consent',
      treatments: '/treatments',
      billing: '/billing/income',
      'billing-income': '/billing/income',
      'billing-expense': '/billing/expense',
      'billing-closures': '/billing/closures',
      'billing-list': '/billing/list',
      'estado-resultado': '/stats',
      users: '/settings', // Mapped to settings placeholder
      inventory: '/inventory',
      settings: '/settings',
      design: '/design',
    };
    const targetPath = routeMap[tabId] || `/${tabId}`;
    navigate(targetPath);
  };

  return (
    <div style={{ display: 'flex', background: '#F8F9FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Figma styled Sidebar */}
      <Sidebar
        activeItem={activeTab}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main Container */}
      <div style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        minWidth: 0
      }}>
        {/* Figma styled TopBar */}
        <TopBar
          title={config.title}
          breadcrumbs={config.breadcrumbs}
          notificationCount={2}
          sidebarWidth={sidebarWidth}
        />

        {/* Page Content area */}
        <main style={{ marginTop: 60, padding: 24, width: '100%', flex: 1, minHeight: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default MainLayout;
