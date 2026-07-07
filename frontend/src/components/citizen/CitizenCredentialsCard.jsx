import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import * as citizenApi from '../../api/citizenApi';

// Two modes based on whether the account already has a password:
// - has password (email signup)   → change password
// - no password (LINE-only signup) → add email + password (enables email login)
const CitizenCredentialsCard = () => {
  const { citizen, setCitizen } = useCitizenAuth();
  const hasPassword = Boolean(citizen?.has_password);

  const [form, setForm] = useState({ current: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrorMsg(''); setOkMsg('');
  };

  const submit = async () => {
    if (form.password.length < 6) { setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (form.password !== form.confirm) { setErrorMsg('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน'); return; }
    if (hasPassword && !form.current) { setErrorMsg('กรุณาระบุรหัสผ่านปัจจุบัน'); return; }
    if (!hasPassword && !form.email) { setErrorMsg('กรุณาระบุอีเมล'); return; }

    setLoading(true);
    try {
      if (hasPassword) {
        await citizenApi.changePassword(form.current, form.password);
        setOkMsg('เปลี่ยนรหัสผ่านสำเร็จ');
      } else {
        const res = await citizenApi.setCredentials(form.email.trim(), form.password);
        if (res.data?.data?.citizen) setCitizen((p) => ({ ...p, ...res.data.data.citizen }));
        setOkMsg('เพิ่มอีเมลและรหัสผ่านสำเร็จ ตอนนี้เข้าสู่ระบบด้วยอีเมลได้แล้ว');
      }
      setForm({ current: '', email: '', password: '', confirm: '' });
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'ดำเนินการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LockIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {hasPassword ? 'เปลี่ยนรหัสผ่าน' : 'เพิ่มอีเมลและรหัสผ่าน'}
          </Typography>
        </Box>
        {!hasPassword && (
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            บัญชีของคุณเข้าสู่ระบบด้วย LINE — เพิ่มอีเมลและรหัสผ่านเพื่อใช้เข้าสู่ระบบด้วยอีเมลเป็นทางเลือกสำรอง
          </Typography>
        )}

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

        {hasPassword ? (
          <TextField
            fullWidth type="password" label="รหัสผ่านปัจจุบัน" name="current"
            value={form.current} onChange={onChange} disabled={loading} size="small" sx={{ mb: 2 }}
            autoComplete="current-password"
          />
        ) : (
          <TextField
            fullWidth type="email" label="อีเมล" name="email"
            value={form.email} onChange={onChange} disabled={loading} size="small" sx={{ mb: 2 }}
            autoComplete="email"
          />
        )}
        <TextField
          fullWidth type="password" label="รหัสผ่านใหม่" name="password"
          value={form.password} onChange={onChange} disabled={loading} size="small" sx={{ mb: 2 }}
          autoComplete="new-password"
        />
        <TextField
          fullWidth type="password" label="ยืนยันรหัสผ่านใหม่" name="confirm"
          value={form.confirm} onChange={onChange} disabled={loading} size="small" sx={{ mb: 2 }}
          autoComplete="new-password"
        />

        <Button variant="contained" onClick={submit} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : (hasPassword ? 'เปลี่ยนรหัสผ่าน' : 'บันทึก')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CitizenCredentialsCard;
