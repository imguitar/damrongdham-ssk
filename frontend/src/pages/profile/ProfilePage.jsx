import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const InfoRow = ({ label, value }) => (
  <Box display="flex" py={1.2}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value || '-'}
    </Typography>
  </Box>
);

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <Box maxWidth={600} mx="auto">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <AccountCircleIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>โปรไฟล์ของฉัน</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Avatar section */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="h5" color="white" fontWeight={700}>
                {user?.full_name
                  ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : user?.username?.[0]?.toUpperCase() || 'U'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {user?.full_name || user?.username}
              </Typography>
              <Chip
                label={user?.role_label || user?.role}
                color="primary"
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={0.5}>
            ข้อมูลส่วนตัว
          </Typography>
          <InfoRow label="ชื่อ-นามสกุล" value={user?.full_name} />
          <InfoRow label="ชื่อผู้ใช้" value={user?.username} />
          <InfoRow label="อีเมล" value={user?.email} />
          <InfoRow label="เบอร์โทรศัพท์" value={user?.phone} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={0.5}>
            ข้อมูลบัญชี
          </Typography>
          <InfoRow label="บทบาท" value={user?.role_label || user?.role} />
          <InfoRow label="เข้าสู่ระบบล่าสุด"
            value={user?.last_login_at ? formatDateTime(user.last_login_at) : '-'} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage;
