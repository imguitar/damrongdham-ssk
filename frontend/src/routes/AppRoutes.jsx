import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import PublicLayout from '../components/layout/PublicLayout';
import CitizenLayout from '../components/layout/CitizenLayout';
import ProtectedRoute from './ProtectedRoute';
import CitizenProtectedRoute from './CitizenProtectedRoute';
import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import { ROLES } from '../utils/constants';

// ── Auth pages ────────────────────────────────────────────────────────────────
import LoginPage          from '../pages/auth/LoginPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import ProfilePage        from '../pages/profile/ProfilePage';

// ── Complaint pages ───────────────────────────────────────────────────────────
import ComplaintListPage   from '../pages/complaints/ComplaintListPage';
import ComplaintCreatePage from '../pages/complaints/ComplaintCreatePage';
import ComplaintDetailPage from '../pages/complaints/ComplaintDetailPage';
import ComplaintEditPage   from '../pages/complaints/ComplaintEditPage';

// ── Admin pages ───────────────────────────────────────────────────────────────
import UserListPage  from '../pages/users/UserListPage';
import UserFormPage  from '../pages/users/UserFormPage';
import AgencyListPage from '../pages/agencies/AgencyListPage';
import SettingsPage   from '../pages/settings/SettingsPage';

// ── Public pages ──────────────────────────────────────────────────────────────
import PublicComplaintPage from '../pages/public/PublicComplaintPage';
import PublicTrackPage     from '../pages/public/PublicTrackPage';
import PublicSuccessPage   from '../pages/public/PublicSuccessPage';

// ── Citizen pages ─────────────────────────────────────────────────────────────
import CitizenLoginPage           from '../pages/citizen/CitizenLoginPage';
import CitizenRegisterPage        from '../pages/citizen/CitizenRegisterPage';
import CitizenComplaintListPage   from '../pages/citizen/CitizenComplaintListPage';
import CitizenComplaintCreatePage from '../pages/citizen/CitizenComplaintCreatePage';
import CitizenComplaintDetailPage from '../pages/citizen/CitizenComplaintDetailPage';
import CitizenProfilePage         from '../pages/citizen/CitizenProfilePage';

// ── Phase 11 pages ────────────────────────────────────────────────────────────
import DashboardPage from '../pages/dashboard/DashboardPage';
import ReportPage    from '../pages/reports/ReportPage';
import AuditLogPage  from '../pages/audit/AuditLogPage';

// ── Phase 12 pages ────────────────────────────────────────────────────────────
import NotificationPage from '../pages/notifications/NotificationPage';

// ─────────────────────────────────────────────────────────────────────────────

const { SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER, EXECUTIVE } = ROLES;

const ALL_STAFF    = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER, EXECUTIVE];
const CENTER_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF];
const WRITE_ROLES  = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF];
const REPORT_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, EXECUTIVE];
const ADMIN_ROLES  = [SUPER_ADMIN, ADMIN];

const AppRoutes = () => (
  <Routes>
    {/* ── Login — standalone ──────────────────────────────────────────── */}
    <Route path="/login" element={<LoginPage />} />

    {/* ── Public with AppBar + Footer ─────────────────────────────────── */}
    <Route element={<PublicLayout />}>
      <Route path="/public/complaints/new" element={<PublicComplaintPage />} />
      <Route path="/public/track"          element={<PublicTrackPage />} />
      <Route path="/public/success"        element={<PublicSuccessPage />} />
    </Route>

    {/* ── Citizen section (CitizenLayout) ─────────────────────────────── */}
    <Route element={<CitizenLayout />}>
      {/* Public citizen pages */}
      <Route path="/citizen/login"    element={<CitizenLoginPage />} />
      <Route path="/citizen/register" element={<CitizenRegisterPage />} />

      {/* Protected citizen pages */}
      <Route element={<CitizenProtectedRoute />}>
        <Route path="/citizen"                                     element={<Navigate to="/citizen/complaints" replace />} />
        <Route path="/citizen/complaints"                          element={<CitizenComplaintListPage />} />
        <Route path="/citizen/complaints/new"                      element={<CitizenComplaintCreatePage />} />
        <Route path="/citizen/complaints/:complaint_number"        element={<CitizenComplaintDetailPage />} />
        <Route path="/citizen/profile"                             element={<CitizenProfilePage />} />
      </Route>
    </Route>

    {/* ── Protected admin routes ───────────────────────────────────────── */}
    <Route element={<ProtectedRoute allowedRoles={ALL_STAFF} />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Complaints — all staff */}
        <Route path="/complaints"     element={<ComplaintListPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

        {/* Complaints write — center roles */}
        <Route element={<ProtectedRoute allowedRoles={WRITE_ROLES} />}>
          <Route path="/complaints/new"       element={<ComplaintCreatePage />} />
          <Route path="/complaints/:id/edit"  element={<ComplaintEditPage />} />
        </Route>

        {/* Reports */}
        <Route element={<ProtectedRoute allowedRoles={REPORT_ROLES} />}>
          <Route path="/reports" element={<ReportPage />} />
        </Route>

        {/* Notifications — all staff can view their own notifications */}
        <Route path="/notifications" element={<NotificationPage />} />

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/users"          element={<UserListPage />} />
          <Route path="/users/new"      element={<UserFormPage />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
          <Route path="/agencies"       element={<AgencyListPage />} />
          <Route path="/settings"       element={<SettingsPage />} />
          <Route path="/settings/*"     element={<SettingsPage />} />
          <Route path="/audit-logs"     element={<AuditLogPage />} />
        </Route>

        {/* All authenticated */}
        <Route path="/profile"         element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
    </Route>

    {/* ── Error pages ──────────────────────────────────────────────────── */}
    <Route path="/403" element={<ForbiddenPage />} />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*"    element={<Navigate to="/404" replace />} />
  </Routes>
);

export default AppRoutes;
