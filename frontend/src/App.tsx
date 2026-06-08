import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './page layouts/MainLayout';
import { Dashboard } from './page layouts/Dashboard';
import { OdontogramScreen } from './features/patients/components/odontograma/components/OdontogramaScreen';

// IMPORTANTE: Tendrás que crear estos componentes en sus respectivas carpetas (features)
import { PatientsScreen } from './features/patients/components/PatientsScreen';
import { AppointmentsScreen } from './features/appointments/components/AppointmentsScreen';
import { GestionIngresos } from './features/billing/components/GestionIngresos';
import { ConsentScreen } from './features/patients/components/ConsentScreen';
import { Card, Alert, DesignSystemScreen } from './context';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<AppointmentsScreen />} />
        {/* Patients sub-routes */}
        <Route path="/patients" element={<Navigate to="/patients/list" replace />} />
        <Route path="/patients/list" element={<PatientsScreen />} />
        <Route path="/patients/odontogram" element={<OdontogramScreen consultaId={18} />} />
        <Route path="/patients/records" element={
          <div style={{ padding: 20 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Historia Clínica</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Módulo de historia clínica en desarrollo.</p>
            </Card>
          </div>
        } />
        <Route path="/patients/consent" element={<ConsentScreen />} />
        <Route path="/treatments" element={
          <div style={{ padding: 20 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Tratamientos</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Módulo de tratamientos en desarrollo.</p>
            </Card>
          </div>
        } />
        
        {/* Billing sub-routes */}
        <Route path="/billing" element={<Navigate to="/billing/income" replace />} />
        <Route path="/billing/income" element={<GestionIngresos />} />
        <Route path="/billing/expense" element={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Alert variant="info" message="Módulo de egresos en desarrollo." />
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Gestión de Egresos</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Este módulo te permitirá registrar y administrar los egresos y gastos de la clínica dental.</p>
            </Card>
          </div>
        } />
        <Route path="/billing/list" element={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Lista de Ingreso / Egreso</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Muestra el flujo de caja unificado y reporte diario de transacciones.</p>
            </Card>
          </div>
        } />
        <Route path="/billing/closures" element={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Cierres de Caja</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Cierres de caja diarios, semanales y mensuales.</p>
            </Card>
          </div>
        } />

        <Route path="/inventory" element={
          <div style={{ padding: 20 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Inventario</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Módulo de inventario en desarrollo.</p>
            </Card>
          </div>
        } />
        <Route path="/stats" element={
          <div style={{ padding: 20 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Estadísticas</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Módulo de estadísticas en desarrollo.</p>
            </Card>
          </div>
        } />
        <Route path="/settings" element={
          <div style={{ padding: 20 }}>
            <Card>
              <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>Configuración</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}>Módulo de configuración en desarrollo.</p>
            </Card>
          </div>
        } />
        <Route path="/consent" element={<Navigate to="/patients/consent" replace />} />
        <Route path="/design" element={<DesignSystemScreen />} />
      </Route>
    </Routes>
  );
}

export default App;