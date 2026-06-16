import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminRoute } from './auth/AdminRoute';
import { AppLayout } from './layout/AppLayout';
import { LoginPage } from './pages/Login/LoginPage';
import { HomePage } from './pages/Home/HomePage';
import { AdminPage } from './pages/Admin/AdminPage';
import { UsersPage } from './pages/Admin/UsersPage';
import { ChangePasswordPage } from './pages/ChangePassword/ChangePasswordPage';
import { DepartmentsPage } from './pages/Departments/DepartmentsPage';
import { TermsPage } from './pages/Terms/TermsPage';
import { TermsConditionsPage } from './pages/TermsConditions/TermsConditionsPage';
import { SlaPage } from './pages/Sla/SlaPage';
import { AuditTrailPage } from './pages/AuditTrail/AuditTrailPage';
import { RiskRegisterPage } from './pages/RiskRegister/RiskRegisterPage';
import { PoliciesPage } from './pages/Policies/PoliciesPage';
import { ProceduresPage } from './pages/Procedures/ProceduresPage';
import { ReportedItemsPage } from './pages/ReportedItems/ReportedItemsPage';
import { DecisionRegisterPage } from './pages/DecisionRegister/DecisionRegisterPage';
import { ContractsRepoPage } from './pages/ContractsRepo/ContractsRepoPage';
import { WhistleblowingPage } from './pages/Whistleblowing/WhistleblowingPage';
import { CircularsPage } from './pages/Circulars/CircularsPage';
import { ObservationsPage } from './pages/Observations/ObservationsPage';
import { PlaceholderPage } from './pages/Placeholder/PlaceholderPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/procedures" element={<ProceduresPage />} />
          <Route path="/circulars" element={<CircularsPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route
            path="/delegation-of-authority"
            element={<PlaceholderPage title="Delegation of Authority Management" />}
          />
          <Route path="/decision-registers" element={<DecisionRegisterPage />} />
          <Route path="/contracts-repo" element={<ContractsRepoPage />} />
          <Route path="/risk-register" element={<RiskRegisterPage />} />
          <Route path="/incidents" element={<PlaceholderPage title="Incident Management" />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/whistleblowing" element={<WhistleblowingPage />} />
          <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
          <Route path="/sla" element={<SlaPage />} />
          <Route path="/audit-trail" element={<AuditTrailPage />} />
          <Route path="/reported-issues-suggestions" element={<ReportedItemsPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
