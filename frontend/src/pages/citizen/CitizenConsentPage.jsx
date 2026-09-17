import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import * as citizenApi from '../../api/citizenApi';
import PrivacyConsentCheckbox from '../../components/citizen/PrivacyConsentCheckbox';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import { alertError, alertWarning, toastSuccess } from '../../utils/alert';

// บัญชีเดิมที่ยังไม่เคยยอมรับประกาศความเป็นส่วนตัว ต้องยอมรับก่อนใช้งานต่อ
const CitizenConsentPage = () => {
  const { setCitizen, logout } = useCitizenAuth();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) { alertWarning('กรุณายอมรับประกาศความเป็นส่วนตัวก่อนดำเนินการต่อ'); return; }

    setLoading(true);
    try {
      const res = await citizenApi.acceptConsent();
      const updated = res.data?.data?.citizen;
      if (updated) setCitizen(updated);
      toastSuccess('บันทึกการยินยอมเรียบร้อย');
      navigate('/citizen/complaints', { replace: true });
    } catch (err) {
      alertError(err, { title: 'บันทึกการยินยอมไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/citizen', { replace: true });
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 560, mx: 'auto', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={700} mb={0.5}>ประกาศความเป็นส่วนตัว</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        ศูนย์ดำรงธรรมจะเก็บและใช้ข้อมูลที่ท่านให้ไว้ (ชื่อ ข้อมูลติดต่อ รายละเอียดเรื่องร้องเรียน และไฟล์แนบ)
        เพื่อรับเรื่อง ตรวจสอบ ส่งต่อหน่วยงาน และแจ้งผลกลับเท่านั้น กรุณาอ่านและยอมรับประกาศก่อนใช้งานต่อ
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <PrivacyConsentCheckbox checked={consent} onChange={setConsent} disabled={loading} sx={{ mb: 2 }} />

        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'ยอมรับและใช้งานต่อ'}
        </Button>
        <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={handleLogout} disabled={loading}>
          ไม่ยอมรับ และออกจากระบบ
        </Button>
      </Box>
    </Paper>
  );
};

export default CitizenConsentPage;
