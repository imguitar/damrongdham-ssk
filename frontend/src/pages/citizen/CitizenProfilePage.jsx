import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import * as citizenApi from '../../api/citizenApi';

const CitizenProfilePage = () => {
  const { citizen, setCitizen } = useCitizenAuth();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (citizen) {
      setForm({ full_name: citizen.full_name || '', phone: citizen.phone || '' });
    }
  }, [citizen]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSuccess(false);
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setErrorMsg('กรุณาระบุชื่อ'); return; }
    setLoading(true);
    try {
      const res = await citizenApi.updateProfile(form);
      setCitizen((p) => ({ ...p, ...res.data?.data?.citizen }));
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <PersonIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>ข้อมูลส่วนตัว</Typography>
      </Box>

      {errorMsg && <ErrorAlert message={errorMsg} sx={{ mb: 2 }} />}
      {success && (
        <Box mb={2} p={1.5} bgcolor="success.50" borderRadius={1} border="1px solid" borderColor="success.light">
          <Typography variant="body2" color="success.dark">บันทึกสำเร็จ</Typography>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="อีเมล" value={citizen?.email || ''}
                disabled size="small" helperText="ไม่สามารถแก้ไขอีเมล"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="ชื่อ-นามสกุล *" name="full_name"
                value={form.full_name} onChange={handleChange}
                disabled={loading} size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="เบอร์โทรศัพท์" name="phone"
                value={form.phone} onChange={handleChange}
                disabled={loading} size="small"
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CitizenProfilePage;
