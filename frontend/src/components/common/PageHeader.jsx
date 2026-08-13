import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

// หัวข้อหน้ามาตรฐาน: ไอคอนในกล่องสีอ่อน + ชื่อหน้า + คำอธิบาย (optional) + ปุ่ม action (optional)
// color = คีย์ palette ('primary' | 'secondary' | 'info' | 'warning' | 'success' | 'error')
const PageHeader = ({ icon, title, subtitle, color = 'primary', action }) => (
  <Box
    display="flex"
    alignItems="center"
    gap={1.75}
    mb={3}
    flexWrap="wrap"
  >
    {icon && (
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: `${color}.main`,
          bgcolor: (t) => alpha(t.palette[color].main, 0.12),
          '& .MuiSvgIcon-root': { fontSize: 24 },
        }}
      >
        {icon}
      </Box>
    )}
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography variant="h5" fontWeight={700} noWrap>{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      )}
    </Box>
    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Box>
);

export default PageHeader;
