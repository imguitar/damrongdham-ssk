import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import * as citizenApi from '../../api/citizenApi';
import LineLinkCard from '../../components/citizen/LineLinkCard';

// event toggles shown only when LINE notifications are enabled
const EVENT_TOGGLES = [
  { key: 'notify_status_change',      label: 'แจ้งเมื่อสถานะเปลี่ยน' },
  { key: 'notify_progress_update',    label: 'แจ้งเมื่อมีความคืบหน้า' },
  { key: 'notify_more_info_required', label: 'แจ้งเมื่อขอข้อมูลเพิ่มเติม' },
  { key: 'notify_resolved',           label: 'แจ้งเมื่อดำเนินการเสร็จ' },
  { key: 'notify_closed',             label: 'แจ้งเมื่อปิดเรื่อง' },
];

const CitizenNotificationSettingsPage = () => {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    citizenApi.getNotificationPreferences()
      .then((res) => setPrefs(res.data?.data?.preferences || null))
      .catch(() => setErrorMsg('ไม่สามารถโหลดการตั้งค่าการแจ้งเตือนได้'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => (e) => {
    setPrefs((p) => ({ ...p, [key]: e.target.checked ? 1 : 0 }));
    setSavedMsg('');
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSavedMsg('');
    try {
      const payload = {
        line_enabled: prefs.line_enabled ? 1 : 0,
        ...Object.fromEntries(EVENT_TOGGLES.map((t) => [t.key, prefs[t.key] ? 1 : 0])),
      };
      const res = await citizenApi.updateNotificationPreferences(payload);
      setPrefs(res.data?.data?.preferences || prefs);
      setSavedMsg('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch {
      setErrorMsg('บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <LineLinkCard />
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      </>
    );
  }

  if (!prefs) {
    return (
      <>
        <LineLinkCard />
        <Alert severity="error" sx={{ maxWidth: 560, mx: 'auto' }}>{errorMsg || 'ไม่พบข้อมูลการตั้งค่า'}</Alert>
      </>
    );
  }

  const lineOn = Boolean(prefs.line_enabled);

  return (
    <>
    <LineLinkCard />
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 560, mx: 'auto', border: '1px solid', borderColor: 'divider' }}>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <NotificationsActiveIcon color="success" />
        <Typography variant="h6" fontWeight={700}>การแจ้งเตือนผ่าน LINE</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        เลือกเหตุการณ์ที่ต้องการรับแจ้งเตือนความคืบหน้าเรื่องร้องเรียนผ่าน LINE
      </Typography>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {savedMsg && <Alert severity="success" sx={{ mb: 2 }}>{savedMsg}</Alert>}

      <FormControlLabel
        control={<Switch checked={lineOn} onChange={toggle('line_enabled')} color="success" />}
        label={<Typography fontWeight={600}>เปิดการแจ้งเตือนผ่าน LINE</Typography>}
      />

      <Divider sx={{ my: 2 }} />

      <Stack spacing={0.5} sx={{ opacity: lineOn ? 1 : 0.5 }}>
        {EVENT_TOGGLES.map((t) => (
          <FormControlLabel
            key={t.key}
            control={
              <Switch
                checked={Boolean(prefs[t.key])}
                onChange={toggle(t.key)}
                disabled={!lineOn}
                color="success"
              />
            }
            label={t.label}
          />
        ))}
      </Stack>

      <Box mt={3} textAlign="right">
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'บันทึกการตั้งค่า'}
        </Button>
      </Box>
    </Paper>
    </>
  );
};

export default CitizenNotificationSettingsPage;
