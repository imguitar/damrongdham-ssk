import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import * as userApi from '../../api/userApi';
import * as agencyApi from '../../api/agencyApi';

// Backend roles (from DB)
const BACKEND_ROLES = [
  { value: 'super_admin', label: 'ผู้ดูแลระบบสูงสุด' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'officer', label: 'เจ้าหน้าที่' },
  { value: 'chief', label: 'หัวหน้าเจ้าหน้าที่' },
  { value: 'agency_officer', label: 'เจ้าหน้าที่หน่วยงาน' },
  { value: 'agency_head', label: 'หัวหน้าหน่วยงาน' },
  { value: 'executive', label: 'ผู้บริหาร' },
];

const AGENCY_ROLES = ['agency_officer', 'agency_head'];

const EMPTY_FORM = {
  username: '', full_name: '', email: '', phone: '',
  role_code: '', agency_id: '', password: '',
};

const UserFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    agencyApi.list().then((r) => setAgencies((r.data?.data?.agencies || []).filter((a) => a.is_active))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    userApi.getById(id)
      .then((res) => {
        const u = res.data?.data;
        setForm({
          username: u.username || '',
          full_name: u.full_name || '',
          email: u.email || '',
          phone: u.phone || '',
          role_code: u.role_code || '',
          agency_id: u.agency_id || '',
          password: '',
        });
      })
      .catch(() => setErrorMsg('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value,
      ...(name === 'role_code' && !AGENCY_ROLES.includes(value) ? { agency_id: '' } : {}),
    }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'กรุณาระบุ Username';
    if (!form.full_name.trim()) e.full_name = 'กรุณาระบุชื่อ';
    if (!form.role_code) e.role_code = 'กรุณาเลือกบทบาท';
    if (!isEdit && !form.password) e.password = 'กรุณาระบุรหัสผ่าน';
    if (form.password && form.password.length < 6) e.password = 'รหัสผ่านอย่างน้อย 6 ตัว';
    if (AGENCY_ROLES.includes(form.role_code) && !form.agency_id) e.agency_id = 'กรุณาเลือกหน่วยงาน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        role_code: form.role_code,
        agency_id: form.agency_id ? Number(form.agency_id) : null,
        ...(form.password ? { password: form.password } : {}),
      };
      if (isEdit) {
        await userApi.update(id, payload);
      } else {
        await userApi.create(payload);
      }
      navigate('/users');
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const needsAgency = AGENCY_ROLES.includes(form.role_code);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')}>กลับ</Button>
        <Typography variant="h5" fontWeight={700}>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</Typography>
      </Box>

      {errorMsg && <ErrorAlert message={errorMsg} sx={{ mb: 2 }} />}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required label="Username" name="username"
                value={form.username} onChange={handleChange}
                disabled={saving || isEdit} size="small"
                error={Boolean(errors.username)} helperText={errors.username}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required label="ชื่อ-นามสกุล" name="full_name"
                value={form.full_name} onChange={handleChange}
                disabled={saving} size="small"
                error={Boolean(errors.full_name)} helperText={errors.full_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="อีเมล" name="email" type="email"
                value={form.email} onChange={handleChange}
                disabled={saving} size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="เบอร์โทร" name="phone"
                value={form.phone} onChange={handleChange}
                disabled={saving} size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size="small" error={Boolean(errors.role_code)}>
                <InputLabel>บทบาท</InputLabel>
                <Select name="role_code" value={form.role_code} label="บทบาท" onChange={handleChange} disabled={saving}>
                  {BACKEND_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label} ({r.value})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {needsAgency && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small" error={Boolean(errors.agency_id)}>
                  <InputLabel>หน่วยงาน</InputLabel>
                  <Select name="agency_id" value={form.agency_id} label="หน่วยงาน" onChange={handleChange} disabled={saving}>
                    {agencies.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            {isEdit ? 'เปลี่ยนรหัสผ่าน (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน *'}
          </Typography>
          <TextField
            label="รหัสผ่าน" name="password" type="password"
            value={form.password} onChange={handleChange}
            disabled={saving} size="small"
            error={Boolean(errors.password)} helperText={errors.password}
            sx={{ width: 280 }}
          />
        </CardContent>
      </Card>

      <Box display="flex" gap={2} mt={3}>
        <Button variant="outlined" onClick={() => navigate('/users')} disabled={saving}>ยกเลิก</Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </Box>
    </Box>
  );
};

export default UserFormPage;
