import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as citizenApi from '../../api/citizenApi';

// friendly messages for link result codes returned by the callback
const LINK_ERRORS = {
  line_identity_conflict: 'บัญชี LINE นี้ถูกผูกกับผู้ใช้รายอื่นแล้ว',
  line_already_linked: 'บัญชีของคุณเชื่อมต่อ LINE ไว้แล้ว',
};

const LineLinkCard = () => {
  const [status, setStatus] = useState(null); // { linked, displayName }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [searchParams, setSearchParams] = useSearchParams();

  const load = () =>
    citizenApi.getLineLinkStatus()
      .then((r) => setStatus(r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // show link result from the callback redirect (?line_linked=1 / ?line_error=...)
  useEffect(() => {
    const linked = searchParams.get('line_linked');
    const err = searchParams.get('line_error');
    if (!linked && !err) return;
    if (linked === '1') { setMsg('เชื่อมต่อบัญชี LINE สำเร็จ'); setMsgType('success'); load(); }
    else if (err) { setMsg(LINK_ERRORS[err] || 'เชื่อมต่อ LINE ไม่สำเร็จ กรุณาลองใหม่'); setMsgType('error'); }
    searchParams.delete('line_linked');
    searchParams.delete('line_error');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleLink = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await citizenApi.lineLinkInit();
      window.location.href = res.data.data.authorizeUrl; // hand off to LINE
    } catch {
      setMsg('ไม่สามารถเริ่มการเชื่อมต่อ LINE ได้');
      setMsgType('error');
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('ต้องการยกเลิกการเชื่อมต่อบัญชี LINE หรือไม่?')) return;
    setBusy(true);
    setMsg('');
    try {
      await citizenApi.unlinkLine();
      setMsg('ยกเลิกการเชื่อมต่อ LINE แล้ว');
      setMsgType('success');
      await load();
    } catch {
      setMsg('ยกเลิกการเชื่อมต่อไม่สำเร็จ');
      setMsgType('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, maxWidth: 560, mx: 'auto', mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <LinkIcon sx={{ color: '#06C755' }} />
        <Typography variant="h6" fontWeight={700}>การเชื่อมต่อบัญชี LINE</Typography>
      </Box>

      {msg && <Alert severity={msgType} sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
      ) : status?.linked ? (
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box>
            <Chip icon={<CheckCircleIcon />} color="success" label="เชื่อมต่อแล้ว" size="small" sx={{ mb: 0.5 }} />
            {status.displayName && (
              <Typography variant="body2" color="text.secondary">บัญชี LINE: {status.displayName}</Typography>
            )}
          </Box>
          <Button variant="outlined" color="error" size="small" onClick={handleUnlink} disabled={busy}>
            ยกเลิกการเชื่อมต่อ
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            เชื่อมต่อบัญชี LINE เพื่อเข้าสู่ระบบด้วย LINE และรับการแจ้งเตือนความคืบหน้า
          </Typography>
          <Button
            onClick={handleLink}
            disabled={busy}
            variant="contained"
            sx={{ bgcolor: '#06C755', fontWeight: 700, '&:hover': { bgcolor: '#05a948' } }}
          >
            {busy ? <CircularProgress size={20} color="inherit" /> : 'ผูกบัญชี LINE'}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LineLinkCard;
