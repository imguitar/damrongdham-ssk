import { useState } from 'react';
import { useNavigate, Link as RouterLink, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../contexts/AuthContext';
import { alertError, alertWarning, toastSuccess } from '../../utils/alert';
import appIcon from '../../components/icons/app-icon-v3.png';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  // If already authenticated, redirect declaratively (no side-effect during render)
  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      alertWarning('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบก่อนเข้าสู่ระบบ');
      return;
    }
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      toastSuccess('เข้าสู่ระบบสำเร็จ');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      alertError(err, { title: 'เข้าสู่ระบบไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: '#FAFBFD',
        // แสงนวล ๆ ด้านบนให้พื้นหลังไม่แบนจนเกินไป (minimal, ไม่รบกวนสายตา)
        backgroundImage:
          'radial-gradient(1100px 460px at 50% -8%, rgba(21,101,192,0.07), transparent 60%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px rgba(16,24,40,0.06)',
          }}
        >
          {/* Brand */}
          <Stack alignItems="center" spacing={1.5} mb={3.5}>
            <Box
              component="img"
              src={appIcon}
              alt="Sisaket E-CMS"
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2.5,
                boxShadow: '0 6px 16px rgba(16,24,40,0.14)',
              }}
            />
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={700} letterSpacing={-0.2}>
                เข้าสู่ระบบ
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                สำหรับเจ้าหน้าที่ · Sisaket E-CMS
              </Typography>
            </Box>
          </Stack>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="ชื่อผู้ใช้"
                name="username"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
              <TextField
                fullWidth
                label="รหัสผ่าน"
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass((p) => !p)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                        aria-label={showPass ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disableElevation
                disabled={loading}
                sx={{ mt: 0.5, py: 1.15, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'เข้าสู่ระบบ'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Secondary actions */}
          <Stack spacing={1.25} alignItems="center">
            <Link
              component={RouterLink}
              to="/citizen"
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              เข้าสู่ระบบสำหรับประชาชน →
            </Link>
            <Link
              component={RouterLink}
              to="/public/track"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              ติดตามสถานะเรื่องร้องเรียน
            </Link>
          </Stack>
        </Paper>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
          ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
