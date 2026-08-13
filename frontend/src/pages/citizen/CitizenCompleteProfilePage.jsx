import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as citizenApi from '../../api/citizenApi';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import { alertError, alertWarning, toastSuccess } from '../../utils/alert';

// Provisional (LINE) accounts complete registration here: profile + PDPA consent.
const CitizenCompleteProfilePage = () => {
  const { citizen, setCitizen } = useCitizenAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: citizen?.full_name && citizen.full_name !== 'ผู้ใช้ LINE' ? citizen.full_name : '',
    phone: '',
    email: '',
    id_card: '',
    address: '',
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { alertWarning('กรุณากรอกชื่อ-นามสกุล'); return; }
    if (!form.phone.trim()) { alertWarning('กรุณากรอกเบอร์โทรศัพท์'); return; }
    if (!consent) { alertWarning('กรุณายอมรับเงื่อนไขการเก็บและใช้ข้อมูลส่วนบุคคลก่อนดำเนินการต่อ'); return; }

    setLoading(true);
    try {
      const res = await citizenApi.completeProfile({ ...form, consent: true });
      const updated = res.data?.data?.citizen;
      if (updated) setCitizen(updated);
      toastSuccess('บันทึกข้อมูลสำเร็จ');
      navigate('/citizen/complaints', { replace: true });
    } catch (err) {
      alertError(err, { title: 'บันทึกข้อมูลไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 560, mx: 'auto', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={700} mb={0.5}>ยืนยันข้อมูลผู้ใช้</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        กรุณากรอกข้อมูลให้ครบถ้วนเพื่อใช้งานระบบและติดตามเรื่องร้องเรียนของท่าน
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField fullWidth required label="ชื่อ-นามสกุล" name="full_name" value={form.full_name}
          onChange={handleChange} disabled={loading} sx={{ mb: 2 }} size="small" autoFocus />
        <TextField fullWidth required label="เบอร์โทรศัพท์" name="phone" value={form.phone}
          onChange={handleChange} disabled={loading} sx={{ mb: 2 }} size="small" inputProps={{ inputMode: 'tel' }} />
        <TextField fullWidth label="อีเมล (ไม่บังคับ)" name="email" type="email" value={form.email}
          onChange={handleChange} disabled={loading} sx={{ mb: 2 }} size="small" />
        <TextField fullWidth label="เลขบัตรประชาชน (ไม่บังคับ)" name="id_card" value={form.id_card}
          onChange={handleChange} disabled={loading} sx={{ mb: 2 }} size="small" inputProps={{ maxLength: 13, inputMode: 'numeric' }} />
        <TextField fullWidth label="ที่อยู่ (ไม่บังคับ)" name="address" value={form.address}
          onChange={handleChange} disabled={loading} sx={{ mb: 2 }} size="small" multiline minRows={2} />

        <FormControlLabel
          control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={loading} />}
          label={
            <Typography variant="body2">
              ข้าพเจ้ายินยอมให้ศูนย์ดำรงธรรมเก็บและใช้ข้อมูลส่วนบุคคลข้างต้น
              เพื่อการรับเรื่องร้องเรียนและติดต่อกลับ ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
            </Typography>
          }
          sx={{ alignItems: 'flex-start', mb: 2 }}
        />

        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'บันทึกและเข้าใช้งาน'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CitizenCompleteProfilePage;
