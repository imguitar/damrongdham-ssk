import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveIcon from '@mui/icons-material/Save';
import * as settingsApi from '../../api/settingsApi';
import { alertError, alertWarning, extractError, toastSuccess } from '../../utils/alert';

const DEFAULT_FORM = {
  escalation_enabled: true,
  escalation_l1_days: 30,
  escalation_l2_offset_days: 15,
  escalation_l3_offset_days: 7,
};

const EscalationSettingPanel = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await settingsApi.getEscalationSettings();
      const settings = response.data?.data?.settings || DEFAULT_FORM;
      setForm({
        escalation_enabled: Boolean(settings.escalation_enabled),
        escalation_l1_days: settings.escalation_l1_days,
        escalation_l2_offset_days: settings.escalation_l2_offset_days,
        escalation_l3_offset_days: settings.escalation_l3_offset_days,
      });
    } catch (err) {
      setError(extractError(err, 'โหลดตั้งค่าการเร่งรัดไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const thresholds = useMemo(() => {
    const l1 = Number(form.escalation_l1_days) || 0;
    const l2 = l1 + (Number(form.escalation_l2_offset_days) || 0);
    const l3 = l2 + (Number(form.escalation_l3_offset_days) || 0);
    return { l1, l2, l3 };
  }, [form]);

  const updateDay = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  };

  const handleSave = async () => {
    const values = [
      form.escalation_l1_days,
      form.escalation_l2_offset_days,
      form.escalation_l3_offset_days,
    ].map(Number);
    if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 365)) {
      alertWarning('จำนวนวันแต่ละช่องต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 365 วัน');
      return;
    }

    setSaving(true);
    try {
      const response = await settingsApi.updateEscalationSettings({
        escalation_enabled: form.escalation_enabled,
        escalation_l1_days: values[0],
        escalation_l2_offset_days: values[1],
        escalation_l3_offset_days: values[2],
      });
      const settings = response.data?.data?.settings;
      if (settings) {
        setForm({
          escalation_enabled: Boolean(settings.escalation_enabled),
          escalation_l1_days: settings.escalation_l1_days,
          escalation_l2_offset_days: settings.escalation_l2_offset_days,
          escalation_l3_offset_days: settings.escalation_l3_offset_days,
        });
      }
      toastSuccess('บันทึกตั้งค่าการเร่งรัดสำเร็จ');
    } catch (err) {
      alertError(err, { title: 'บันทึกตั้งค่าไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>ตั้งค่าระดับการเร่งรัด</Typography>
            <Typography variant="body2" color="text.secondary">
              กำหนดรอบแจ้งเตือนเมื่อเรื่องไม่มีการอัปเดตความคืบหน้า
            </Typography>
          </Box>
          <FormControlLabel
            control={(
              <Switch
                checked={form.escalation_enabled}
                onChange={(event) => setForm((previous) => ({
                  ...previous,
                  escalation_enabled: event.target.checked,
                }))}
              />
            )}
            label={form.escalation_enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          />
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          การเปลี่ยนค่าจะมีผลในการตรวจสอบรอบถัดไป และไม่มีผลย้อนหลังต่อการแจ้งเตือนที่ส่งไปแล้ว
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth type="number" label="ระดับที่ 1 (L1)" value={form.escalation_l1_days}
              onChange={updateDay('escalation_l1_days')} inputProps={{ min: 1, max: 365 }}
              helperText="จำนวนวันก่อนเร่งรัดครั้งแรก"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth type="number" label="เพิ่มก่อนระดับที่ 2 (L2)" value={form.escalation_l2_offset_days}
              onChange={updateDay('escalation_l2_offset_days')} inputProps={{ min: 1, max: 365 }}
              helperText="จำนวนวันที่เพิ่มจาก L1"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth type="number" label="เพิ่มก่อนระดับที่ 3 (L3)" value={form.escalation_l3_offset_days}
              onChange={updateDay('escalation_l3_offset_days')} inputProps={{ min: 1, max: 365 }}
              helperText="จำนวนวันที่เพิ่มจาก L2"
            />
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>เกณฑ์สะสมที่จะใช้งาน</Typography>
          <Grid container spacing={1.5}>
            {[
              { level: 'L1', days: thresholds.l1, color: '#ED6C02', detail: 'แจ้งเตือนระดับที่ 1' },
              { level: 'L2', days: thresholds.l2, color: '#D32F2F', detail: 'แจ้งเตือนระดับที่ 2' },
              { level: 'L3', days: thresholds.l3, color: '#8E0000', detail: 'แจ้งเตือนระดับสูงสุด' },
            ].map((item) => (
              <Grid item xs={12} sm={4} key={item.level}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: item.color }}>{item.level}</Typography>
                  <Typography variant="h5" fontWeight={800}>{item.days.toLocaleString('th-TH')} วัน</Typography>
                  <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
            บันทึกการตั้งค่า
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EscalationSettingPanel;
