import { Navigate, Route, Routes } from "react-router-dom";
import {
  AppointmentsScreen,
  AppointmentDetailScreen,
  AppointmentFormScreen,
  PatientAppointmentHistoryScreen,
} from "./features/appointments";
import { LoginForm } from "./features/auth/components/LoginForm";
import { ResetPasswordPage } from "./features/auth/components/ResetPasswordPage";
import { ListaFinanciera } from "./features/billing/components/ListaFinanciera";
import { RecordatoriosScreen } from "./features/reminders";
import { HistorialConfirmacionesScreen } from "./features/reminders/components/HistorialConfirmacionesScreen";
import { GestionIngresos } from "./features/billing/components/GestionIngresos";
import { GestionEgresos } from "./features/billing/components/GestionEgresos";
import { FacturasDeConsultas } from "./features/billing/components/FacturasDeConsultas";
import { ConsentScreen } from "./features/consent/components/ConsentScreen";
import { ExpedienteScreen } from "./features/patients/components/expediente/components/ExpedienteScreen";
import { OdontogramScreen } from "./features/patients/components/odontograma/components/OdontogramaScreen";
import {
  PatientFormScreen,
  PatientProfileScreen,
  PatientsScreen,
} from "./features/patients";
import {
  PermissionsManagementScreen,
  RolesScreen,
  UsersScreen,
} from "./features/users";

import { MiPerfil } from "./features/users/components/MiPerfil";
import { ForcePasswordChange } from "./features/auth/components/ForcePasswordChange";
import { Card, DesignSystemScreen } from "./context";
import { Dashboard } from "./page layouts/Dashboard";
import { MainLayout } from "./page layouts/MainLayout";
import { AuthGuard, GuestGuard, PrivilegeGuard } from "./routes/index";
import { CierresView } from "./features/cierres";
import { InventoryHistoryScreen, InventoryScreen } from "./features/inventory";
import { TreatmentsScreen } from "./features/treatments/components/TreatmentsScreen";
import { TreatmentForm } from "./features/treatments/components/TreatmentForm";

function App() {
  return (
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
          path="/billing/list"
          element={
            <PrivilegeGuard privileges={[12, 13]}>
              <ListaFinanciera />
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
                    Estadísticas
                  </h3>
                  <p
                    style={{ margin: "8px 0 0", fontSize: 13, color: "#888F94" }}
                  >
                    Módulo de estadísticas en desarrollo.
                  </p>
                </Card>
              </div>
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
  );
}

export default App;
