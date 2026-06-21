import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const PublicSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const complaintNumber = state?.complaint_number;

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>
            ส่งเรื่องร้องเรียนสำเร็จ
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Sisaket E-Complaint Management System ได้รับเรื่องของท่านแล้ว
          </Typography>

          {complaintNumber && (
            <Box
              sx={{
                bgcolor: 'primary.50',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 2,
                mb: 3,
              }}
            >
              <Typography variant="caption" color="text.secondary">เลขที่เรื่องร้องเรียน</Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main" letterSpacing={2}>
                {complaintNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                กรุณาบันทึกเลขที่นี้ไว้เพื่อติดตามสถานะ
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" mb={3}>
            เจ้าหน้าที่จะดำเนินการคัดกรองและส่งต่อหน่วยงานที่เกี่ยวข้อง
            ท่านสามารถติดตามสถานะได้ด้วยเลขที่เรื่องด้านบน
          </Typography>

          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/public/track')}
            >
              ติดตามสถานะ
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/public/complaints/new')}
            >
              ยื่นเรื่องใหม่
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PublicSuccessPage;
