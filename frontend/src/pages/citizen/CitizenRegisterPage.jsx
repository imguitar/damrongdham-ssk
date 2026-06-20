import { useState } from 'react';
import { Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import * as citizenApi from '../../api/citizenApi';

const CitizenRegisterPage = () => {
  const { citizen, login } = useCitizenAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (citizen) return <Navigate to="/citizen/complaints" replace />;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [e.target.name]: '' }));
    setErrorMsg('');
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'กรุณาระบุชื่อ-นามสกุล';
    if (!form.email.trim()) e.email = 'กรุณาระบุอีเมล';
    if (form.password.length < 6) e.password = 'รหัสผ่านอย่างน้อย 6 ตัวอักษร';
    if (form.password !== form.confirm_password) e.confirm_password = 'รหัสผ่านไม่ตรงกัน';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await citizenApi.register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      // Auto-login after register
      await login(form.email.trim(), form.password);
      navigate('/citizen/complaints', { replace: true });
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" py={4}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 4 }, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>สมัครสมาชิก</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          สร้างบัญชีเพื่อติดตามเรื่องร้องเรียนของท่าน
        </Typography>

        {errorMsg && <ErrorAlert message={errorMsg} sx={{ mb: 2 }} />}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="ชื่อ-นามสกุล *" name="full_name"
                value={form.full_name} onChange={handleChange}
                disabled={loading} size="small"
                error={Boolean(fieldErrors.full_name)} helperText={fieldErrors.full_name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="อีเมล *" name="email" type="email"
                value={form.email} onChange={handleChange}
                disabled={loading} size="small"
                error={Boolean(fieldErrors.email)} helperText={fieldErrors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="เบอร์โทรศัพท์" name="phone"
                value={form.phone} onChange={handleChange}
                disabled={loading} size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="รหัสผ่าน *" name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                disabled={loading} size="small"
                error={Boolean(fieldErrors.password)} helperText={fieldErrors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass((p) => !p)} edge="end" size="small" tabIndex={-1}>
                        {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="ยืนยันรหัสผ่าน *" name="confirm_password"
                type="password"
                value={form.confirm_password} onChange={handleChange}
                disabled={loading} size="small"
                error={Boolean(fieldErrors.confirm_password)} helperText={fieldErrors.confirm_password}
              />
            </Grid>
          </Grid>

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 3 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'สมัครสมาชิก'}
          </Button>
        </Box>

        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            มีบัญชีแล้ว?{' '}
            <Link component={RouterLink} to="/citizen/login" fontWeight={600}>
              เข้าสู่ระบบ
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CitizenRegisterPage;
