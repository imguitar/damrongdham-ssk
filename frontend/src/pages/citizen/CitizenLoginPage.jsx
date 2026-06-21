import { useState } from 'react';
import { Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import { AUTH_APPBAR_HEIGHT, AUTH_APPBAR_TITLE_FONT_SIZE, AUTH_CARD_MAX_WIDTH, AUTH_CARD_MIN_HEIGHT, AUTH_LOGIN_ICON_SIZE, AUTH_LOGIN_ICON_RADIUS } from '../../utils/constants';
import appIcon from '../../components/icons/App-Icon-v2.png';

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
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #F4F6F8 45%, #E8EAF6 100%)' }}
    >
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 1, minHeight: `${AUTH_APPBAR_HEIGHT}px !important`, height: AUTH_APPBAR_HEIGHT }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/citizen/login"
            sx={{ color: 'white', textDecoration: 'none', fontWeight: 700, flexGrow: 1, fontSize: AUTH_APPBAR_TITLE_FONT_SIZE }}
          >
            Sisaket E-Complaint Management System
          </Typography>
          <Button component={RouterLink} to="/login" size="small" sx={{ color: 'white' }}>
            เจ้าหน้าที่
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
        maxWidth="sm"
        sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}
      >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: AUTH_CARD_MAX_WIDTH,
          minHeight: AUTH_CARD_MIN_HEIGHT,
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'success.light',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            height: 6,
            background: 'linear-gradient(90deg, #1B5E20 0%, #2E7D32 60%, #43A047 100%)',
          },
        }}
      >
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: AUTH_LOGIN_ICON_SIZE,
              height: AUTH_LOGIN_ICON_SIZE,
              borderRadius: AUTH_LOGIN_ICON_RADIUS,
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
              boxShadow: '0 10px 24px rgba(27,94,32,0.24)',
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
              bgcolor: '#E8F5E9',
              color: 'success.dark',
              fontWeight: 700,
            }}
          >
            <AssignmentTurnedInIcon sx={{ fontSize: 15 }} />
            สำหรับประชาชน
          </Typography>
          <Typography variant="h5" fontWeight={700} mb={0.5}>เข้าสู่ระบบประชาชน</Typography>
          <Typography variant="body2" color="text.secondary">
            ยื่นเรื่องและติดตามสถานะเรื่องร้องเรียนของท่าน
          </Typography>
        </Box>

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
          <Typography variant="body2" mt={1}>
            <Link component={RouterLink} to="/public/track" color="text.secondary" variant="body2">
              ติดตามสถานะ
            </Link>
          </Typography>
        </Box>
      </Paper>
      </Container>

      <Box
        component="footer"
        sx={{ py: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.6)' }}
      >
        <Typography variant="body2" color="text.secondary">
          Sisaket E-Complaint Management System
        </Typography>
      </Box>
    </Box>
  );
};

export default CitizenLoginPage;
