import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import PublicLayout from '../components/layout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import { ROLES } from '../utils/constants';

// ── Placeholder pages (replaced in Phase 9, 10, 11 …) ───────────────────────
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Placeholder = ({ title }) => (
  <Box py={6} textAlign="center">
    <Typography variant="h5" color="text.secondary">{title}</Typography>
    <Typography variant="body2" color="text.disabled" mt={1}>
      (อยู่ระหว่างพัฒนา)
    </Typography>
  </Box>
);

const LoginPage          = () => <Placeholder title="หน้า Login" />;
const DashboardPage      = () => <Placeholder title="Dashboard" />;
const ComplaintsPage     = () => <Placeholder title="เรื่องร้องเรียน" />;
const ComplaintNewPage   = () => <Placeholder title="ยื่นเรื่องร้องเรียน" />;
const ComplaintDetailPage= () => <Placeholder title="รายละเอียดเรื่องร้องเรียน" />;
const ComplaintEditPage  = () => <Placeholder title="แก้ไขเรื่องร้องเรียน" />;
const ReportsPage        = () => <Placeholder title="รายงาน" />;
const NotificationsPage  = () => <Placeholder title="การแจ้งเตือน" />;
const UsersPage          = () => <Placeholder title="จัดการผู้ใช้งาน" />;
const UserNewPage        = () => <Placeholder title="เพิ่มผู้ใช้งาน" />;
const UserEditPage       = () => <Placeholder title="แก้ไขผู้ใช้งาน" />;
const AgenciesPage       = () => <Placeholder title="จัดการหน่วยงาน" />;
const SettingsPage       = () => <Placeholder title="ตั้งค่า Master Data" />;
const AuditLogsPage      = () => <Placeholder title="Audit Log" />;
const ProfilePage        = () => <Placeholder title="โปรไฟล์ของฉัน" />;
const ChangePasswordPage = () => <Placeholder title="เปลี่ยนรหัสผ่าน" />;
const PublicComplaintNew = () => <Placeholder title="ยื่นเรื่องร้องเรียน (ประชาชน)" />;
const PublicTrackPage    = () => <Placeholder title="ติดตามสถานะเรื่องร้องเรียน" />;
// ─────────────────────────────────────────────────────────────────────────────

const { SUPER_ADMIN, ADMIN, SUPERVISOR, OFFICER, AGENCY_HEAD, AGENCY_OFFICER, VIEWER } = ROLES;

const ALL_STAFF    = [SUPER_ADMIN, ADMIN, SUPERVISOR, OFFICER, AGENCY_HEAD, AGENCY_OFFICER, VIEWER];
const CENTER_ROLES = [SUPER_ADMIN, ADMIN, SUPERVISOR, OFFICER];
const WRITE_ROLES  = [SUPER_ADMIN, ADMIN, SUPERVISOR, OFFICER];
const REPORT_ROLES = [SUPER_ADMIN, ADMIN, SUPERVISOR, OFFICER, VIEWER];
const ADMIN_ROLES  = [SUPER_ADMIN, ADMIN];

const AppRoutes = () => (
  <Routes>
    {/* ── Public (no auth required) ── */}
    <Route element={<PublicLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/complaints/new" element={<PublicComplaintNew />} />
      <Route path="/public/track" element={<PublicTrackPage />} />
    </Route>

    {/* ── Protected (auth required + AdminLayout) ── */}
    <Route element={<ProtectedRoute allowedRoles={ALL_STAFF} />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Complaints — all staff */}
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

        {/* Complaints write — center roles only */}
        <Route element={<ProtectedRoute allowedRoles={WRITE_ROLES} />}>
          <Route path="/complaints/new" element={<ComplaintNewPage />} />
          <Route path="/complaints/:id/edit" element={<ComplaintEditPage />} />
        </Route>

        {/* Reports */}
        <Route element={<ProtectedRoute allowedRoles={REPORT_ROLES} />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        {/* Notifications */}
        <Route element={<ProtectedRoute allowedRoles={CENTER_ROLES} />}>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<UserNewPage />} />
          <Route path="/users/:id/edit" element={<UserEditPage />} />
          <Route path="/agencies" element={<AgenciesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>

        {/* Profile — all authenticated */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
    </Route>

    {/* ── Error pages ── */}
    <Route path="/403" element={<ForbiddenPage />} />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default AppRoutes;
