import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_APPBAR_HEIGHT, AUTH_APPBAR_TITLE_FONT_SIZE, AUTH_CARD_MAX_WIDTH, AUTH_CARD_MIN_HEIGHT, AUTH_LOGIN_ICON_SIZE, AUTH_LOGIN_ICON_RADIUS } from '../../utils/constants';
import appIcon from '../../components/icons/App-Icon-v2.png';

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
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #E3F2FD 0%, #F4F6F8 45%, #E8EAF6 100%)',
      }}
    >
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 1, minHeight: `${AUTH_APPBAR_HEIGHT}px !important`, height: AUTH_APPBAR_HEIGHT }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/login"
            sx={{ color: 'white', textDecoration: 'none', fontWeight: 700, flexGrow: 1, fontSize: AUTH_APPBAR_TITLE_FONT_SIZE }}
          >
            Sisaket E-Complaint Management System
          </Typography>
          <Button component={RouterLink} to="/citizen/login" size="small" sx={{ color: 'white' }}>
            ประชาชน
          </Button>
          <Button
            component={RouterLink}
            to="/public/track"
            variant="outlined"
            size="small"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            ติดตามสถานะ
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        disableGutters
        maxWidth="lg"
        sx={{
          flex: 1,
          py: 4,
          px: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: AUTH_CARD_MAX_WIDTH,
            minHeight: AUTH_CARD_MIN_HEIGHT,
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'primary.light',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              height: 6,
              background: 'linear-gradient(90deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)',
            },
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                width: AUTH_LOGIN_ICON_SIZE,
                height: AUTH_LOGIN_ICON_SIZE,
                borderRadius: AUTH_LOGIN_ICON_RADIUS,
                background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: '0 10px 24px rgba(13,71,161,0.28)',
                overflow: 'hidden',
              }}
            >
              <Box
                component="img"
                src={appIcon}
                alt="App icon"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                py: 0.4,
                mb: 1,
                borderRadius: 999,
                bgcolor: '#E3F2FD',
                color: 'primary.dark',
                fontWeight: 700,
              }}
            >
              <ShieldIcon sx={{ fontSize: 15 }} />
              สำหรับเจ้าหน้าที่
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              เข้าสู่ระบบเจ้าหน้าที่
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Sisaket E-Complaint Management System
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
              to="/citizen/login"
              variant="body2"
              fontWeight={700}
              sx={{
                mb: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <AssignmentTurnedInIcon sx={{ fontSize: 17 }} />
              เข้าสู่ระบบประชาชน
            </Link>
            <Link
              component={RouterLink}
              to="/public/track"
              variant="body2"
              color="text.secondary"
              display="block"
            >
              ติดตามสถานะเรื่องร้องเรียน
            </Link>
          </Box>
        </Paper>
      </Container>

      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.100',
          py: 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Sisaket E-Complaint Management System
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
