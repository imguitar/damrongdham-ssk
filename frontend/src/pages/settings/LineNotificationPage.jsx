import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import StaffLineNotifyCard from '../../components/common/StaffLineNotifyCard';
import LineGroupManager from '../../components/common/LineGroupManager';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

// roles allowed to manage LINE group targets (mirrors backend MANAGE_ROLES)
const MANAGE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CHIEF, ROLES.OFFICER, ROLES.AGENCY_HEAD];

const LineNotificationPage = () => {
  const { user } = useAuth();
  const canManageGroups = MANAGE_ROLES.includes(user?.role);

  return (
    <Box maxWidth={860} mx="auto">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <ChatIcon sx={{ color: '#06C755' }} />
        <Typography variant="h5" fontWeight={700}>การแจ้งเตือน LINE</Typography>
      </Box>

      {/* ส่วนตัว — เจ้าหน้าที่ทุกคน */}
      <StaffLineNotifyCard />

      {/* กลุ่มหน่วยงาน — เฉพาะผู้มีสิทธิ์จัดการ */}
      {canManageGroups && <LineGroupManager />}
    </Box>
  );
};

export default LineNotificationPage;
