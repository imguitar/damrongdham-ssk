import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
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
      <Typography variant="h1" fontWeight={700} color="primary" sx={{ fontSize: '6rem' }}>
        404
      </Typography>
      <Typography variant="h5" fontWeight={600} color="text.primary">
        ไม่พบหน้าที่ต้องการ
      </Typography>
      <Typography variant="body1" color="text.secondary">
        หน้าที่คุณกำลังค้นหาไม่มีอยู่หรือถูกย้ายไปแล้ว
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 1 }}>
        กลับหน้าหลัก
      </Button>
    </Box>
  );
};

export default NotFoundPage;
