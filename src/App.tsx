import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthContext';
import { RequireAdmin, RequireStaff } from './auth/guards';
import { PublicLayout } from './layouts/PublicLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { LookupPage } from './pages/public/LookupPage';
import { TramiteStatusPage } from './pages/public/TramiteStatusPage';
import { LoginPage } from './pages/staff/LoginPage';
import { ProceduresListPage } from './pages/staff/ProceduresListPage';
import { StudentsPage } from './pages/staff/StudentsPage';
import { CorrelativesPage } from './pages/staff/CorrelativesPage';
import { ChangePasswordPage } from './pages/staff/ChangePasswordPage';
import { ProfilePage } from './pages/staff/ProfilePage';
import { UsersAdminPage } from './pages/staff/admin/UsersAdminPage';
import { ProgramsAdminPage } from './pages/staff/admin/ProgramsAdminPage';
import { ProcedureTypesAdminPage } from './pages/staff/admin/ProcedureTypesAdminPage';
import { PresentedDocumentTypesAdminPage } from './pages/staff/admin/PresentedDocumentTypesAdminPage';
import { IdentityDocumentTypesAdminPage } from './pages/staff/admin/IdentityDocumentTypesAdminPage';
import { isStaffHost } from './utils/host';

/** On admin.tramitesccf.online, the public lookup form isn't the point — send visitors straight to staff login instead. */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  if (isStaffHost()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'flex items-center gap-2 rounded-sm bg-navy-900 px-4 py-3 text-sm text-white shadow-lg',
          },
        }}
      />
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicOnlyRoute><LookupPage /></PublicOnlyRoute>} />
            <Route path="/tramite" element={<PublicOnlyRoute><TramiteStatusPage /></PublicOnlyRoute>} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          {/* Staff */}
          <Route
            path="/app"
            element={
              <RequireStaff>
                <StaffLayout />
              </RequireStaff>
            }
          >
            <Route index element={<Navigate to="tramites" replace />} />
            <Route path="tramites" element={<ProceduresListPage />} />
            <Route path="tramites/nuevo" element={<ProceduresListPage />} />
            <Route path="tramites/:id" element={<ProceduresListPage />} />
            <Route path="alumnos" element={<StudentsPage />} />
            <Route path="correlativos" element={<CorrelativesPage />} />
            <Route path="cambiar-contrasena" element={<ChangePasswordPage />} />
            <Route path="perfil" element={<ProfilePage />} />

            <Route
              path="admin/usuarios"
              element={
                <RequireAdmin>
                  <UsersAdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/tipos"
              element={
                <RequireAdmin>
                  <ProcedureTypesAdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/programas"
              element={
                <RequireAdmin>
                  <ProgramsAdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/doc-presentados"
              element={
                <RequireAdmin>
                  <PresentedDocumentTypesAdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/doc-identidad"
              element={
                <RequireAdmin>
                  <IdentityDocumentTypesAdminPage />
                </RequireAdmin>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
