import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
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
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already authenticated, redirect declaratively (no side-effect during render)
  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setErrorMsg('กรุณาระบุชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await login(form.username.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={2}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <Typography variant="h6" color="white" fontWeight={700}>
              ดธ
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            ระบบรับเรื่องร้องเรียน DCMS
          </Typography>
        </Box>

        {/* Error alert */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Login form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="ชื่อผู้ใช้ (Username)"
            name="username"
            value={form.username}
            onChange={handleChange}
            disabled={loading}
            autoComplete="username"
            autoFocus
            sx={{ mb: 2 }}
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
                  >
                    {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ fontWeight: 700, py: 1.2 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'เข้าสู่ระบบ'}
          </Button>
        </Box>

        {/* Public links */}
        <Box mt={3} textAlign="center">
          <Link
            component={RouterLink}
            to="/public/complaints/new"
            variant="body2"
            display="block"
            sx={{ mb: 0.5 }}
          >
            ยื่นเรื่องร้องเรียน (สำหรับประชาชน)
          </Link>
          <Link
            component={RouterLink}
            to="/public/track"
            variant="body2"
            color="text.secondary"
          >
            ติดตามสถานะเรื่องร้องเรียน
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
