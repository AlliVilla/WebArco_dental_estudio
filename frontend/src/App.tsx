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
import { ConsentScreen } from "./features/consent/services/ConsentScreen";
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
import { Alert, Card, DesignSystemScreen } from "./context";
import { Dashboard } from "./page layouts/Dashboard";
import { MainLayout } from "./page layouts/MainLayout";
import { AuthGuard, GuestGuard } from "./routes/index";
import { CierresView } from "./features/cierres";
import { InventoryScreen } from "./features/inventory";
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
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<AppointmentsScreen />} />
        <Route path="/agenda/new" element={<AppointmentFormScreen />} />
        <Route path="/agenda/:id" element={<AppointmentDetailScreen />} />
        <Route
          path="/agenda/:id/history"
          element={<PatientAppointmentHistoryScreen />}
        />
        <Route path="/agenda/:id/edit" element={<AppointmentFormScreen />} />
        <Route path="/agenda/reminders" element={<RecordatoriosScreen />} />
        <Route
          path="/agenda/reminders/historial"
          element={<HistorialConfirmacionesScreen />}
        />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        {/* Patients sub-routes */}
        <Route
          path="/patients"
          element={<Navigate to="/patients/list" replace />}
        />
        <Route path="/patients/list" element={<PatientsScreen />} />
        <Route path="/patients/new" element={<PatientFormScreen />} />
        <Route path="/patients/edit/:id" element={<PatientFormScreen />} />
        <Route
          path="/patients/profile/:id"
          element={<PatientProfileScreen />}
        />
        <Route path="/patients/odontogram" element={<OdontogramScreen />} />
        <Route path="/patients/records" element={<ExpedienteScreen />} />
        <Route path="/patients/consent" element={<ConsentScreen />} />
        <Route path="/treatments" element={<TreatmentsScreen />} />
        <Route
          path="/treatments/new"
          element={<TreatmentForm mode="create" />}
        />
        <Route
          path="/treatments/edit/:id"
          element={<TreatmentForm mode="edit" />}
        />
        <Route
          path="/treatments"
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
                  Tratamientos
                </h3>
                <p
                  style={{ margin: "8px 0 0", fontSize: 13, color: "#888F94" }}
                >
                  Módulo de tratamientos en desarrollo.
                </p>
              </Card>
            </div>
          }
        />

        <Route
          path="/billing"
          element={<Navigate to="/billing/income" replace />}
        />
        <Route path="/billing/income" element={<GestionIngresos />} />
        <Route
          path="/billing/expense"
          element={
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Alert
                variant="info"
                message="Módulo de egresos en desarrollo."
              />
              <Card>
                <h3
                  style={{
                    margin: 0,
                    color: "#203F49",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Gestión de Egresos
                </h3>
                <p
                  style={{ margin: "8px 0 0", fontSize: 13, color: "#888F94" }}
                >
                  Este módulo te permitirá registrar y administrar los egresos y
                  gastos de la clínica dental.
                </p>
              </Card>
            </div>
          }
        />
        <Route path="/billing/list" element={<ListaFinanciera />} />
        <Route
          path="/billing/closures"
          element={<CierresView />}
        />

        <Route path="/inventory" element={<InventoryScreen />} />
        <Route
          path="/stats"
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
                  Estadísticas
                </h3>
                <p
                  style={{ margin: "8px 0 0", fontSize: 13, color: "#888F94" }}
                >
                  Módulo de estadísticas en desarrollo.
                </p>
              </Card>
            </div>
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

        <Route path="/users" element={<UsersScreen />} />
        <Route path="/users/roles" element={<RolesScreen />} />
        <Route
          path="/users/roles/permisos"
          element={<PermissionsManagementScreen />}
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
