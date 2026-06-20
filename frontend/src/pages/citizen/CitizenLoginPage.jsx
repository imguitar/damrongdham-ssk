import { useState } from 'react';
import { Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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

const CitizenLoginPage = () => {
  const { citizen, login } = useCitizenAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (citizen) return <Navigate to="/citizen/complaints" replace />;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    try {
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
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>เข้าสู่ระบบสมาชิก</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          ติดตามเรื่องร้องเรียนของท่าน
        </Typography>

        {errorMsg && <ErrorAlert message={errorMsg} sx={{ mb: 2 }} />}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth label="อีเมล" name="email" type="email"
            value={form.email} onChange={handleChange}
            disabled={loading} autoComplete="email" autoFocus sx={{ mb: 2 }} size="small"
          />
          <TextField
            fullWidth label="รหัสผ่าน" name="password"
            type={showPass ? 'text' : 'password'}
            value={form.password} onChange={handleChange}
            disabled={loading} autoComplete="current-password" sx={{ mb: 3 }} size="small"
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
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'เข้าสู่ระบบ'}
          </Button>
        </Box>

        <Box mt={3} textAlign="center">
          <Typography variant="body2">
            ยังไม่มีบัญชี?{' '}
            <Link component={RouterLink} to="/citizen/register" fontWeight={600}>
              สมัครสมาชิก
            </Link>
          </Typography>
          <Typography variant="body2" mt={1}>
            <Link component={RouterLink} to="/public/complaints/new" color="text.secondary" variant="body2">
              ยื่นเรื่องโดยไม่สมัครสมาชิก →
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CitizenLoginPage;
