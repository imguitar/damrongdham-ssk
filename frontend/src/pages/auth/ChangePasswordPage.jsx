import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import * as authApi from '../../api/authApi';

const INITIAL = { current_password: '', new_password: '', confirm_password: '' };

// Defined outside component to keep stable reference across re-renders
// (prevents TextField unmount/remount and loss of focus on each keystroke)
const PasswordField = ({ name, label, showKey, value, onChange, show, onToggle, disabled }) => (
  <TextField
    fullWidth
    label={label}
    name={name}
    type={show ? 'text' : 'password'}
    value={value}
    onChange={onChange}
    disabled={disabled}
    autoComplete="new-password"
    sx={{ mb: 2 }}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <IconButton onClick={() => onToggle(showKey)} edge="end" size="small" tabIndex={-1}>
            {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </InputAdornment>
      ),
    }}
  />
);

const ChangePasswordPage = () => {
  const [form, setForm]         = useState(INITIAL);
  const [show, setShow]         = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess]   = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
    setSuccess(false);
  };

  const toggleShow = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    if (!form.current_password) return 'กรุณาระบุรหัสผ่านปัจจุบัน';
    if (!form.new_password) return 'กรุณาระบุรหัสผ่านใหม่';
    if (form.new_password.length < 6) return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
    if (form.new_password !== form.confirm_password) return 'รหัสผ่านใหม่ไม่ตรงกัน';
    if (form.current_password === form.new_password)
      return 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setLoading(true);
    setErrorMsg('');
    try {
      await authApi.changePassword(form.current_password, form.new_password);
      setSuccess(true);
      setForm(INITIAL);
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
    <Box maxWidth={480} mx="auto">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <LockOutlinedIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>เปลี่ยนรหัสผ่าน</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              เปลี่ยนรหัสผ่านสำเร็จ
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <PasswordField
              name="current_password"
              label="รหัสผ่านปัจจุบัน"
              showKey="current"
              value={form.current_password}
              onChange={handleChange}
              show={show.current}
              onToggle={toggleShow}
              disabled={loading}
            />
            <PasswordField
              name="new_password"
              label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
              showKey="new"
              value={form.new_password}
              onChange={handleChange}
              show={show.new}
              onToggle={toggleShow}
              disabled={loading}
            />
            <PasswordField
              name="confirm_password"
              label="ยืนยันรหัสผ่านใหม่"
              showKey="confirm"
              value={form.confirm_password}
              onChange={handleChange}
              show={show.confirm}
              onToggle={toggleShow}
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'บันทึกรหัสผ่านใหม่'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePasswordPage;
