import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "./components";
import { Card } from "./context";
import { MainLayout } from "./page layouts/MainLayout";
import { AuthGuard, GuestGuard, PrivilegeGuard } from "./routes/index";

const AppointmentsScreen = lazy(() =>
  import("./features/appointments").then((m) => ({ default: m.AppointmentsScreen }))
);
const AppointmentDetailScreen = lazy(() =>
  import("./features/appointments").then((m) => ({ default: m.AppointmentDetailScreen }))
);
const AppointmentFormScreen = lazy(() =>
  import("./features/appointments").then((m) => ({ default: m.AppointmentFormScreen }))
);
const PatientAppointmentHistoryScreen = lazy(() =>
  import("./features/appointments").then((m) => ({ default: m.PatientAppointmentHistoryScreen }))
);
const LoginForm = lazy(() => import("./features/auth/components/LoginForm"));
const ResetPasswordPage = lazy(() => import("./features/auth/components/ResetPasswordPage"));
const RecordatoriosScreen = lazy(() =>
  import("./features/reminders").then((m) => ({ default: m.RecordatoriosScreen }))
);
const HistorialConfirmacionesScreen = lazy(
  () => import("./features/reminders/components/HistorialConfirmacionesScreen").then((m) => ({ default: m.HistorialConfirmacionesScreen }))
);
const GestionIngresos = lazy(() => import("./features/billing/components/GestionIngresos").then((m) => ({ default: m.GestionIngresos })));
const GestionEgresos = lazy(() => import("./features/billing/components/GestionEgresos").then((m) => ({ default: m.GestionEgresos })));
const FacturasDeConsultas = lazy(() => import("./features/billing/components/FacturasDeConsultas").then((m) => ({ default: m.FacturasDeConsultas })));
const ConsentScreen = lazy(() => import("./features/consent/components/ConsentScreen").then((m) => ({ default: m.ConsentScreen })));
const ExpedienteScreen = lazy(
  () => import("./features/patients/components/expediente/components/ExpedienteScreen").then((m) => ({ default: m.ExpedienteScreen }))
);
const OdontogramScreen = lazy(
  () => import("./features/patients/components/odontograma/components/OdontogramaScreen").then((m) => ({ default: m.OdontogramScreen }))
);
const PatientFormScreen = lazy(() => import("./features/patients").then((m) => ({ default: m.PatientFormScreen })));
const PatientProfileScreen = lazy(() => import("./features/patients").then((m) => ({ default: m.PatientProfileScreen })));
const PatientsScreen = lazy(() => import("./features/patients").then((m) => ({ default: m.PatientsScreen })));
const PermissionsManagementScreen = lazy(() => import("./features/users").then((m) => ({ default: m.PermissionsManagementScreen })));
const RolesScreen = lazy(() => import("./features/users").then((m) => ({ default: m.RolesScreen })));
const UsersScreen = lazy(() => import("./features/users").then((m) => ({ default: m.UsersScreen })));
const MiPerfil = lazy(() => import("./features/users/components/MiPerfil").then((m) => ({ default: m.MiPerfil })));
const ForcePasswordChange = lazy(() => import("./features/auth/components/ForcePasswordChange").then((m) => ({ default: m.ForcePasswordChange })));
const DesignSystemScreen = lazy(() => import("./context/DesignSystemScreen").then((m) => ({ default: m.DesignSystemScreen })));
const Dashboard = lazy(() => import("./page layouts/Dashboard").then((m) => ({ default: m.Dashboard })));
const CierresView = lazy(() => import("./features/cierres").then((m) => ({ default: m.CierresView })));
const InventoryScreen = lazy(() => import("./features/inventory").then((m) => ({ default: m.InventoryScreen })));
const InventoryHistoryScreen = lazy(() => import("./features/inventory").then((m) => ({ default: m.InventoryHistoryScreen })));
const TreatmentsScreen = lazy(() => import("./features/treatments/components/TreatmentsScreen"));
const TreatmentForm = lazy(() => import("./features/treatments/components/TreatmentForm"));
const EstadoResultadosScreen = lazy(() => import("./features/reports").then((m) => ({ default: m.EstadoResultadosScreen })));

function SuspenseFallback() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner size={40} />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginForm />
            </GuestGuard>
          }
        />
      <Route
        path="/reset-password"
        element={
          <GuestGuard>
            <ResetPasswordPage />
          </GuestGuard>
        }
      />

      <Route
        path="/force-password-change"
        element={
          <AuthGuard>
            <ForcePasswordChange />
          </AuthGuard>
        }
      />
      <Route
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/agenda"
          element={
            <PrivilegeGuard privileges={[26, 69]}>
              <AppointmentsScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/agenda/new"
          element={
            <PrivilegeGuard privileges={[27]}>
              <AppointmentFormScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/agenda/:id"
          element={
            <PrivilegeGuard privileges={[26]}>
              <AppointmentDetailScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/agenda/:id/history"
          element={
            <PrivilegeGuard privileges={[26]}>
              <PatientAppointmentHistoryScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/agenda/:id/edit"
          element={
            <PrivilegeGuard privileges={[27]}>
              <AppointmentFormScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/agenda/reminders"
          element={
            <PrivilegeGuard privileges={[30]}>
              <RecordatoriosScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/agenda/reminders/historial"
          element={
            <PrivilegeGuard privileges={[31]}>
              <HistorialConfirmacionesScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/mi-perfil"
          element={
            <PrivilegeGuard privileges={[9]}>
              <MiPerfil />
            </PrivilegeGuard>
          }
        />
        {/* Patients sub-routes */}
        <Route
          path="/patients"
          element={<Navigate to="/patients/list" replace />}
        />
        <Route
          path="/patients/list"
          element={
            <PrivilegeGuard privileges={[16]}>
              <PatientsScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/patients/new"
          element={
            <PrivilegeGuard privileges={[17]}>
              <PatientFormScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/patients/edit/:id"
          element={
            <PrivilegeGuard privileges={[17]}>
              <PatientFormScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/patients/profile/:id"
          element={
            <PrivilegeGuard privileges={[16]}>
              <PatientProfileScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/patients/odontogram"
          element={
            <PrivilegeGuard privileges={[3]}>
              <OdontogramScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/patients/records"
          element={
            <PrivilegeGuard privileges={[20]}>
              <ExpedienteScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/patients/consent"
          element={
            <PrivilegeGuard privileges={[25]}>
              <ConsentScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/treatments"
          element={
            <PrivilegeGuard privileges={[65, 66]}>
              <TreatmentsScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/treatments/new"
          element={
            <PrivilegeGuard privileges={[66]}>
              <TreatmentForm mode="create" />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/treatments/edit/:id"
          element={
            <PrivilegeGuard privileges={[66]}>
              <TreatmentForm mode="edit" />
            </PrivilegeGuard>
          }
        />

        <Route
          path="/billing"
          element={<Navigate to="/billing/income" replace />}
        />
        <Route
          path="/billing/income"
          element={
            <PrivilegeGuard privileges={[12]}>
              <GestionIngresos />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/billing/facturacion-cobros"
          element={
            <PrivilegeGuard privileges={[12]}>
              <FacturasDeConsultas />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/billing/expense"
          element={
            <PrivilegeGuard privileges={[13]}>
              <GestionEgresos />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/billing/closures"
          element={
            <PrivilegeGuard privileges={[15]}>
              <CierresView />
            </PrivilegeGuard>
          }
        />

        <Route
          path="/inventory"
          element={
            <PrivilegeGuard privileges={[63]}>
              <InventoryScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/inventory/history"
          element={
            <PrivilegeGuard privileges={[63]}>
              <InventoryHistoryScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/stats"
          element={
            <PrivilegeGuard privileges={[2]}>
              <EstadoResultadosScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <div style={{ padding: 20 }}>
              <Card>
                <h3
                  style={{
                    margin: 0,
                    color: "#203F49",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Configuración
                </h3>
                <p
                  style={{ margin: "8px 0 0", fontSize: 13, color: "#888F94" }}
                >
                  Módulo de configuración en desarrollo.
                </p>
              </Card>
            </div>
          }
        />

        <Route
          path="/users"
          element={
            <PrivilegeGuard privileges={[6]}>
              <UsersScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/users/roles"
          element={
            <PrivilegeGuard privileges={[34]}>
              <RolesScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/users/roles/permisos"
          element={
            <PrivilegeGuard privileges={[37]}>
              <PermissionsManagementScreen />
            </PrivilegeGuard>
          }
        />
        <Route
          path="/consent"
          element={<Navigate to="/patients/consent" replace />}
        />
        <Route path="/design" element={<DesignSystemScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
}

export default App;
