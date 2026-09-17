import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import ComplaintReceiptPrint from '../../components/complaints/ComplaintReceiptPrint';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const PublicSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const trackingCode = state?.tracking_code;
  const receipt = state?.receipt;
  const [copied, setCopied] = useState(false);

  const copyTrackingCode = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
    } catch {
      // clipboard API ใช้ไม่ได้ (เช่น เปิดผ่าน http) — ใช้วิธีเลือกข้อความแล้วคัดลอกแทน
      const el = document.createElement('textarea');
      el.value = trackingCode;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      if (!ok) return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

          {trackingCode && (
            <Box
              sx={{
                bgcolor: 'primary.50',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: { xs: 2, sm: 3 },
                mb: 3,
              }}
            >
              <Typography variant="h6" component="p" fontWeight={600} color="text.secondary">
                รหัสติดตามเรื่องร้องเรียน
              </Typography>
              <Typography
                variant="h2"
                component="p"
                fontWeight={700}
                color="primary.main"
                sx={{ letterSpacing: { xs: 8, sm: 12 }, fontSize: { xs: '3rem', sm: '3.75rem' }, my: 1 }}
              >
                {trackingCode}
              </Typography>
              <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap" mb={1.5}>
                <Button
                  variant={copied ? 'contained' : 'outlined'}
                  color={copied ? 'success' : 'primary'}
                  startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  onClick={copyTrackingCode}
                >
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
                </Button>
                {receipt && (
                  <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
                    พิมพ์คำร้อง
                  </Button>
                )}
              </Box>
              <Typography variant="subtitle1" component="p" fontWeight={700} sx={{ color: 'error.dark' }}>
                กรุณาบันทึกรหัสนี้ไว้ และไม่เปิดเผยให้ผู้อื่นทราบ
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" mb={3}>
            เจ้าหน้าที่จะดำเนินการคัดกรองและส่งต่อหน่วยงานที่เกี่ยวข้อง
            ท่านสามารถติดตามสถานะได้ด้วยรหัสติดตามด้านบน
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
      {trackingCode && receipt && <ComplaintReceiptPrint trackingCode={trackingCode} receipt={receipt} />}
    </Box>
  );
};

export default PublicSuccessPage;
