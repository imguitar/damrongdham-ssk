import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import PublicLayout from '../components/layout/PublicLayout';
import CitizenLayout from '../components/layout/CitizenLayout';
import ProtectedRoute from './ProtectedRoute';
import CitizenProtectedRoute from './CitizenProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import { ROLES } from '../utils/constants';

// ── Auth pages ────────────────────────────────────────────────────────────────
import LoginPage          from '../pages/auth/LoginPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import ProfilePage        from '../pages/profile/ProfilePage';

// ── Complaint pages ───────────────────────────────────────────────────────────
// หน้าที่ import ไลบรารีหนัก (leaflet/recharts) แยกออกเป็น chunk ต่างหากด้วย lazy
import ComplaintListPage   from '../pages/complaints/ComplaintListPage';
const ComplaintCreatePage = lazy(() => import('../pages/complaints/ComplaintCreatePage'));
const ComplaintDetailPage = lazy(() => import('../pages/complaints/ComplaintDetailPage'));
const ComplaintEditPage   = lazy(() => import('../pages/complaints/ComplaintEditPage'));
const ComplaintPrintPage  = lazy(() => import('../pages/complaints/ComplaintPrintPage'));

// ── Admin pages ───────────────────────────────────────────────────────────────
import UserListPage  from '../pages/users/UserListPage';
import UserFormPage  from '../pages/users/UserFormPage';
import AgencyListPage from '../pages/agencies/AgencyListPage';
import CitizenMemberListPage from '../pages/citizenMembers/CitizenMemberListPage';
import SettingsPage   from '../pages/settings/SettingsPage';
import LineNotificationPage from '../pages/settings/LineNotificationPage';

// ── Public pages ──────────────────────────────────────────────────────────────
const PublicComplaintPage = lazy(() => import('../pages/public/PublicComplaintPage'));
import PublicTrackPage     from '../pages/public/PublicTrackPage';
import PublicSuccessPage   from '../pages/public/PublicSuccessPage';
import PrivacyNoticePage   from '../pages/public/PrivacyNoticePage';

// ── Citizen pages ─────────────────────────────────────────────────────────────
import CitizenStartPage           from '../pages/citizen/CitizenStartPage';
import CitizenLoginPage           from '../pages/citizen/CitizenLoginPage';
import CitizenLineCallbackPage    from '../pages/citizen/CitizenLineCallbackPage';
import CitizenRegisterPage        from '../pages/citizen/CitizenRegisterPage';
import CitizenComplaintListPage   from '../pages/citizen/CitizenComplaintListPage';
const CitizenComplaintCreatePage = lazy(() => import('../pages/citizen/CitizenComplaintCreatePage'));
import CitizenComplaintDetailPage from '../pages/citizen/CitizenComplaintDetailPage';
import CitizenProfilePage         from '../pages/citizen/CitizenProfilePage';
import CitizenNotificationSettingsPage from '../pages/citizen/CitizenNotificationSettingsPage';
import CitizenCompleteProfilePage  from '../pages/citizen/CitizenCompleteProfilePage';
import CitizenConsentPage          from '../pages/citizen/CitizenConsentPage';

// ── Phase 11 pages (recharts-heavy) ───────────────────────────────────────────
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ReportPage    = lazy(() => import('../pages/reports/ReportPage'));
import AuditLogPage  from '../pages/audit/AuditLogPage';

// ── Phase 12 pages ────────────────────────────────────────────────────────────
import NotificationPage from '../pages/notifications/NotificationPage';
const UserManualPage = lazy(() => import('../pages/manual/UserManualPage'));

// ─────────────────────────────────────────────────────────────────────────────

const { SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER, EXECUTIVE } = ROLES;

const ALL_STAFF    = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER, EXECUTIVE];
// เรื่องร้องเรียน = staff ที่ทำงานกับเรื่อง (ไม่รวม executive ซึ่งดูได้แค่ Dashboard/Report)
// ต้องตรงกับ backend complaintRoutes.STAFF_ROLES
const COMPLAINT_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER];
const CENTER_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF];
const WRITE_ROLES  = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF];
const REPORT_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, EXECUTIVE];
const ADMIN_ROLES  = [SUPER_ADMIN, ADMIN];

const AppRoutes = () => (
  <Suspense fallback={<LoadingSpinner fullPage />}>
  <Routes>
    {/* หน้าแรก (/) → หน้าเริ่มต้นของประชาชน; เจ้าหน้าที่เข้าผ่าน /login หรือ /dashboard */}
    <Route path="/" element={<Navigate to="/citizen" replace />} />

    {/* ── Login — standalone ──────────────────────────────────────────── */}
    <Route path="/login"         element={<LoginPage />} />
    {/* หน้าเลือกโหมดก่อนเข้าสู่ระบบ: ยื่นทันที / เข้าสู่ระบบ / ติดตามสถานะ */}
    <Route path="/citizen"       element={<CitizenStartPage />} />
    <Route path="/citizen/login" element={<CitizenLoginPage />} />
    <Route path="/citizen/line/callback" element={<CitizenLineCallbackPage />} />

    {/* ── Public with AppBar + Footer ─────────────────────────────────── */}
    <Route element={<PublicLayout />}>
      <Route path="/public/complaints/new" element={<PublicComplaintPage />} />
      <Route path="/public/track"          element={<PublicTrackPage />} />
      <Route path="/public/success"        element={<PublicSuccessPage />} />
      {/* ประกาศความเป็นส่วนตัวฉบับเต็ม — ลิงก์จากข้อความใน LINE */}
      <Route path="/public/privacy"        element={<PrivacyNoticePage />} />
      <Route path="/public/manual"         element={<UserManualPage audience="public" />} />
    </Route>

    {/* ── Citizen section (CitizenLayout) ─────────────────────────────── */}
    <Route element={<CitizenLayout />}>
      {/* Public citizen pages */}
      <Route path="/citizen/register" element={<CitizenRegisterPage />} />

      {/* Protected citizen pages */}
      <Route element={<CitizenProtectedRoute />}>
        <Route path="/citizen/complete-profile"                    element={<CitizenCompleteProfilePage />} />
        <Route path="/citizen/consent"                             element={<CitizenConsentPage />} />
        <Route path="/citizen/complaints"                          element={<CitizenComplaintListPage />} />
        <Route path="/citizen/complaints/new"                      element={<CitizenComplaintCreatePage />} />
        <Route path="/citizen/complaints/:tracking_code"           element={<CitizenComplaintDetailPage />} />
        <Route path="/citizen/profile"                             element={<CitizenProfilePage />} />
        <Route path="/citizen/notifications"                       element={<CitizenNotificationSettingsPage />} />
        <Route path="/citizen/manual"                              element={<UserManualPage audience="citizen" />} />
      </Route>
    </Route>

    {/* ── Protected admin routes ───────────────────────────────────────── */}
    <Route element={<ProtectedRoute allowedRoles={ALL_STAFF} />}>
      {/* หน้าพิมพ์ / PDF — ไม่มี sidebar/topbar */}
      <Route element={<ProtectedRoute allowedRoles={COMPLAINT_ROLES} />}>
        <Route path="/complaints/:id/print" element={<ComplaintPrintPage />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Complaints — staff who work on cases (executive excluded — matches backend) */}
        <Route element={<ProtectedRoute allowedRoles={COMPLAINT_ROLES} />}>
          <Route path="/complaints"     element={<ComplaintListPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>

        {/* Complaints write — center roles */}
        <Route element={<ProtectedRoute allowedRoles={WRITE_ROLES} />}>
          <Route path="/complaints/new"       element={<ComplaintCreatePage />} />
          <Route path="/complaints/:id/edit"  element={<ComplaintEditPage />} />
        </Route>

        {/* Reports */}
        <Route element={<ProtectedRoute allowedRoles={REPORT_ROLES} />}>
          <Route path="/reports" element={<ReportPage />} />
        </Route>

        {/* Notifications — staff who work on cases (executive is read-only dashboard/report) */}
        <Route element={<ProtectedRoute allowedRoles={COMPLAINT_ROLES} />}>
          <Route path="/notifications" element={<NotificationPage />} />
        </Route>

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

        {/* Super admin only — สมาชิกประชาชน (แยกจากผู้ใช้งานเจ้าหน้าที่) */}
        <Route element={<ProtectedRoute allowedRoles={[SUPER_ADMIN]} />}>
          <Route path="/citizen-members" element={<CitizenMemberListPage />} />
        </Route>

        {/* All authenticated */}
        <Route path="/profile"            element={<ProfilePage />} />
        <Route path="/line-notifications" element={<LineNotificationPage />} />
        <Route path="/manual"             element={<UserManualPage />} />
        <Route path="/change-password"    element={<ChangePasswordPage />} />
      </Route>
    </Route>

    {/* ── Error pages ──────────────────────────────────────────────────── */}
    <Route path="/403" element={<ForbiddenPage />} />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*"    element={<Navigate to="/404" replace />} />
  </Routes>
  </Suspense>
);

export default AppRoutes;
