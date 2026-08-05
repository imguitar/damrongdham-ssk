import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import * as authApi from '../../api/authApi';

const LINK_ERRORS = {
  line_identity_conflict: 'บัญชี LINE นี้ถูกผูกกับผู้ใช้รายอื่นแล้ว',
  line_already_linked: 'บัญชีของคุณเชื่อมต่อ LINE ไว้แล้ว',
};
const EVENT_TOGGLES = [
  { key: 'notify_new', label: 'เรื่องร้องเรียนใหม่เข้าระบบ' },
  { key: 'notify_forwarded', label: 'มีเรื่องส่งต่อมายังหน่วยงาน' },
  { key: 'notify_sla', label: 'ใกล้/เกินกำหนดดำเนินการ' },
  { key: 'notify_escalation', label: 'การเร่งรัด (Escalation)' },
];

const StaffLineNotifyCard = () => {
  const [status, setStatus] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [searchParams, setSearchParams] = useSearchParams();

  const load = async () => {
    try {
      const [s, p] = await Promise.all([authApi.lineLinkStatus(), authApi.getLineNotifPrefs()]);
      setStatus(s.data?.data || null);
      setPrefs(p.data?.data?.preferences || null);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const linked = searchParams.get('line_linked');
    const err = searchParams.get('line_error');
    if (!linked && !err) return;
    if (linked === '1') { setMsg('เชื่อมต่อบัญชี LINE สำเร็จ'); setMsgType('success'); load(); }
    else if (err) { setMsg(LINK_ERRORS[err] || 'เชื่อมต่อ LINE ไม่สำเร็จ'); setMsgType('error'); }
    searchParams.delete('line_linked'); searchParams.delete('line_error');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleLink = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await authApi.lineLinkInit();
      window.location.href = res.data.data.authorizeUrl;
    } catch { setMsg('ไม่สามารถเริ่มการเชื่อมต่อ LINE ได้'); setMsgType('error'); setBusy(false); }
  };
  const handleUnlink = async () => {
    if (!window.confirm('ต้องการยกเลิกการเชื่อมต่อบัญชี LINE หรือไม่?')) return;
    setBusy(true); setMsg('');
    try { await authApi.lineUnlink(); setMsg('ยกเลิกการเชื่อมต่อ LINE แล้ว'); setMsgType('success'); await load(); }
    catch { setMsg('ยกเลิกไม่สำเร็จ'); setMsgType('error'); }
    finally { setBusy(false); }
  };
  const togglePref = (key) => async (e) => {
    const next = { ...prefs, [key]: e.target.checked ? 1 : 0 };
    setPrefs(next);
    try { await authApi.updateLineNotifPrefs({ [key]: next[key] }); } catch { load(); }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <NotificationsActiveIcon sx={{ color: '#06C755' }} />
          <Typography variant="h6" fontWeight={700}>การแจ้งเตือนผ่าน LINE (ส่วนตัว)</Typography>
        </Box>

        {msg && <Alert severity={msgType} sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
        ) : status?.linked ? (
          <>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" mb={1}>
              <Box>
                <Chip icon={<CheckCircleIcon />} color="success" label="เชื่อมต่อแล้ว" size="small" />
                {status.displayName && (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>บัญชี LINE: {status.displayName}</Typography>
                )}
              </Box>
              <Button variant="outlined" color="error" size="small" onClick={handleUnlink} disabled={busy}>
                ยกเลิกการเชื่อมต่อ
              </Button>
            </Box>
            {/* ผูกบัญชีแล้วยังไม่พอ — ต้องเพิ่มเพื่อน OA ด้วย ไม่งั้น DM ส่งไม่ถึง */}
            {status.oaFriend === false && (
              <Alert
                severity="warning"
                icon={false}
                sx={{ mb: 1 }}
                action={status.addFriendUrl ? (
                  <Button size="small" href={status.addFriendUrl} target="_blank" rel="noopener"
                    sx={{ bgcolor: '#06C755', color: '#fff', fontWeight: 700, '&:hover': { bgcolor: '#05a948' } }}>
                    เพิ่มเพื่อน
                  </Button>
                ) : null}
              >
                ยังไม่ได้เพิ่มบัญชีทางการ (OA) เป็นเพื่อน — ระบบ<strong>ส่งการแจ้งเตือนถึงท่านไม่ได้</strong>
              </Alert>
            )}

            <Divider sx={{ my: 1.5 }} />
            <FormControlLabel
              control={<Switch checked={Boolean(prefs?.line_enabled)} onChange={togglePref('line_enabled')} color="success" />}
              label={<Typography fontWeight={600}>เปิดการแจ้งเตือนส่วนตัวผ่าน LINE</Typography>}
            />
            <Box sx={{ opacity: prefs?.line_enabled ? 1 : 0.5, mt: 0.5 }}>
              {EVENT_TOGGLES.map((t) => (
                <FormControlLabel
                  key={t.key}
                  control={<Switch checked={Boolean(prefs?.[t.key])} onChange={togglePref(t.key)} disabled={!prefs?.line_enabled} color="success" />}
                  label={t.label}
                  sx={{ display: 'flex' }}
                />
              ))}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              เชื่อมต่อบัญชี LINE ส่วนตัวเพื่อรับการแจ้งเตือนงานที่เกี่ยวข้องกับท่านโดยตรง
            </Typography>
            <Button onClick={handleLink} disabled={busy} variant="contained"
              sx={{ bgcolor: '#06C755', fontWeight: 700, '&:hover': { bgcolor: '#05a948' } }}>
              {busy ? <CircularProgress size={20} color="inherit" /> : 'ผูกบัญชี LINE'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffLineNotifyCard;
