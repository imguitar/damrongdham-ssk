import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
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
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import { alertError, alertWarning, toastSuccess } from '../../utils/alert';
import appIcon from '../../components/icons/app-icon-v2.png';

// Friendly Thai messages for backend LINE error codes (details logged server-side)
const LINE_ERROR_MESSAGES = {
  line_login_cancelled: 'คุณยกเลิกการเข้าสู่ระบบด้วย LINE',
  line_invalid_state: 'เซสชันหมดอายุ กรุณาลองเข้าสู่ระบบด้วย LINE ใหม่อีกครั้ง',
  line_identity_conflict: 'พบปัญหาการเชื่อมบัญชี กรุณาติดต่อเจ้าหน้าที่',
  line_account_disabled: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเจ้าหน้าที่',
};
const getLineError = (code) =>
  !code ? '' : (LINE_ERROR_MESSAGES[code] || 'ไม่สามารถเข้าสู่ระบบด้วย LINE ได้ กรุณาลองใหม่อีกครั้ง');

// LINE Login must hit the backend origin directly so the OAuth state cookie is set
// on the same origin the callback returns to. Empty in prod (single origin).
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || '';

const CitizenLoginPage = () => {
  const { citizen, login } = useCitizenAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // แจ้งผลการเข้าสู่ระบบด้วย LINE ที่ redirect กลับมาพร้อม error code
  useEffect(() => {
    const lineErr = getLineError(searchParams.get('line_error'));
    if (lineErr) alertWarning(lineErr, { title: 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ' });
  }, [searchParams]);

  if (citizen) return <Navigate to="/citizen/complaints" replace />;

  const handleLineLogin = () => {
    window.location.href = `${API_ORIGIN}${import.meta.env.BASE_URL}api/citizen/auth/line`;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      alertWarning('กรุณากรอกอีเมลและรหัสผ่านให้ครบก่อนเข้าสู่ระบบ');
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toastSuccess('เข้าสู่ระบบสำเร็จ');
      navigate('/citizen/complaints', { replace: true });
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
        // โทนเขียวนวลด้านบน แยกเอกลักษณ์จากหน้าเจ้าหน้าที่ (โทนน้ำเงิน)
        backgroundImage:
          'radial-gradient(1100px 460px at 50% -8%, rgba(46,125,50,0.07), transparent 60%)',
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
                สำหรับประชาชน · ยื่นและติดตามเรื่องร้องเรียน
              </Typography>
            </Box>
          </Stack>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="อีเมล"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
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
                color="success"
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

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.secondary">หรือ</Typography>
          </Divider>

          <Button
            onClick={handleLineLogin}
            fullWidth
            size="large"
            disableElevation
            disabled={loading}
            aria-label="เข้าสู่ระบบด้วย LINE"
            sx={{
              py: 1.15,
              borderRadius: 2,
              bgcolor: '#06C755',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#05a948' },
            }}
          >
            เข้าสู่ระบบด้วย LINE
          </Button>

          <Divider sx={{ my: 3 }} />

          {/* Secondary actions */}
          <Stack spacing={1.25} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              ยังไม่มีบัญชี?{' '}
              <Link component={RouterLink} to="/citizen/register" fontWeight={700} underline="hover" color="success.dark">
                สมัครสมาชิก
              </Link>
            </Typography>
            <Link
              component={RouterLink}
              to="/public/complaints/new"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              ยื่นเรื่องโดยไม่สมัครสมาชิก →
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
          เป็นเจ้าหน้าที่?{' '}
          <Link component={RouterLink} to="/login" color="inherit" underline="hover" fontWeight={600}>
            เข้าสู่ระบบสำหรับเจ้าหน้าที่
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default CitizenLoginPage;
