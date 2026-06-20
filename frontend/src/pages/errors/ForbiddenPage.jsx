import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <Typography variant="h1" fontWeight={700} color="error" sx={{ fontSize: '6rem' }}>
        403
      </Typography>
      <Typography variant="h5" fontWeight={600} color="text.primary">
        ไม่มีสิทธิ์เข้าถึง
      </Typography>
      <Typography variant="body1" color="text.secondary">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 1 }}>
        ย้อนกลับ
      </Button>
    </Box>
  );
};

export default ForbiddenPage;
