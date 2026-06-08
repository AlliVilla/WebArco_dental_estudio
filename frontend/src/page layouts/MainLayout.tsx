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
  agenda: { title: 'Agenda', breadcrumbs: ['Inicio', 'Agenda'] },
  patients: { title: 'Pacientes', breadcrumbs: ['Inicio', 'Pacientes'] },
  'patients-list': { title: 'Registro de Pacientes', breadcrumbs: ['Pacientes', 'Registro'] },
  'patients-odontogram': { title: 'Odontograma de Paciente', breadcrumbs: ['Pacientes', 'Odontograma'] },
  'patients-records': { title: 'Historia Clínica', breadcrumbs: ['Pacientes', 'Historia Clínica'] },
  'patients-consent': { title: 'Consentimientos', breadcrumbs: ['Pacientes', 'Consentimientos'] },
  treatments: { title: 'Tratamientos', breadcrumbs: ['Gestión', 'Tratamientos'] },
  billing: { title: 'Facturación / Caja', breadcrumbs: ['Gestión', 'Facturación'] },
  'billing-income': { title: 'Gestión de Ingresos', breadcrumbs: ['Gestión', 'Facturación', 'Ingresos'] },
  'billing-expense': { title: 'Gestión de Egresos', breadcrumbs: ['Gestión', 'Facturación', 'Egresos'] },
  'billing-list': { title: 'Lista de Ingresos / Egresos', breadcrumbs: ['Gestión', 'Facturación', 'Listado'] },
  'billing-closures': { title: 'Cierres de Caja', breadcrumbs: ['Gestión', 'Facturación', 'Cierres'] },
  inventory: { title: 'Inventario', breadcrumbs: ['Gestión', 'Inventario'] },
  stats: { title: 'Estadísticas', breadcrumbs: ['Reportes', 'Estadísticas'] },
  settings: { title: 'Configuración', breadcrumbs: ['Inicio', 'Configuración'] },
  consent: { title: 'Consentimientos', breadcrumbs: ['Pacientes', 'Consentimientos'] },
  design: { title: 'Sistema de Diseño UI Kit', breadcrumbs: ['Inicio', 'Sistema de Diseño'] },
};

export const MainLayout: React.FC<MainLayoutProps> = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (pathname: string) => {
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
    if (pathname === '/agenda' || pathname === '/appointments') return 'agenda';
    if (pathname === '/patients') return 'patients';
    if (pathname === '/patients/list') return 'patients-list';
    if (pathname === '/patients/odontogram') return 'patients-odontogram';
    if (pathname === '/patients/records') return 'patients-records';
    if (pathname === '/patients/consent') return 'patients-consent';
    if (pathname === '/treatments') return 'treatments';
    if (pathname === '/billing') return 'billing';
    if (pathname === '/billing/income') return 'billing-income';
    if (pathname === '/billing/expense') return 'billing-expense';
    if (pathname === '/billing/list') return 'billing-list';
    if (pathname === '/billing/closures') return 'billing-closures';
    if (pathname === '/inventory') return 'inventory';
    if (pathname === '/stats') return 'stats';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/consent') return 'consent';
    if (pathname === '/design') return 'design';
    return pathname.substring(1);
  };

  const activeTab = getActiveTab(location.pathname);
  const config = screenConfig[activeTab] || { title: activeTab, breadcrumbs: [] };

  const handleNavigate = (tabId: string) => {
    const routeMap: Record<string, string> = {
      dashboard: '/dashboard',
      agenda: '/agenda',
      patients: '/patients/list',
      'patients-list': '/patients/list',
      'patients-odontogram': '/patients/odontogram',
      'patients-records': '/patients/records',
      'patients-consent': '/patients/consent',
      treatments: '/treatments',
      billing: '/billing/income',
      'billing-income': '/billing/income',
      'billing-expense': '/billing/expense',
      'billing-list': '/billing/list',
      'billing-closures': '/billing/closures',
      inventory: '/inventory',
      stats: '/stats',
      settings: '/settings',
      consent: '/patients/consent',
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
