import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GroupsIcon from '@mui/icons-material/Groups';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import * as lineAdminApi from '../../api/lineAdminApi';
import * as agencyApi from '../../api/agencyApi';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const EVENT_FLAGS = [
  { key: 'notify_new', label: 'เรื่องใหม่' },
  { key: 'notify_forwarded', label: 'ส่งต่อ' },
  { key: 'notify_sla', label: 'SLA' },
  { key: 'notify_escalation', label: 'เร่งรัด' },
];

const LineGroupManager = () => {
  const { user } = useAuth();
  const isAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role);

  const [groups, setGroups] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ scope: isAdmin ? 'center' : 'agency', agency_id: '', label: '' });
  const [generated, setGenerated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadGroups = () => lineAdminApi.listGroups().then((r) => setGroups(r.data?.data?.groups || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      loadGroups(),
      isAdmin ? agencyApi.list({ limit: 200 }).then((r) => {
        const d = r.data?.data;
        setAgencies(Array.isArray(d) ? d : (d?.agencies || []));
      }).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [isAdmin]);

  const handleGenerate = async () => {
    setErrorMsg(''); setGenerated(null);
    const payload = { scope: form.scope, label: form.label || undefined };
    if (form.scope === 'agency') {
      payload.agency_id = isAdmin ? Number(form.agency_id) : user?.agency_id;
      if (!payload.agency_id) { setErrorMsg('กรุณาเลือกหน่วยงาน'); return; }
    }
    setBusy(true);
    try {
      const res = await lineAdminApi.createPairingCode(payload);
      setGenerated(res.data.data);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'ออกรหัสไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const toggleFlag = (g, key) => async (e) => {
    const val = e.target.checked ? 1 : 0;
    setGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, [key]: val } : x)));
    try { await lineAdminApi.updateGroup(g.id, { [key]: val }); } catch { loadGroups(); }
  };
  const handleUnbind = async (g) => {
    if (!window.confirm(`ยกเลิกการเชื่อมต่อกลุ่ม "${g.label || g.group_id}" ?`)) return;
    try { await lineAdminApi.deleteGroup(g.id); await loadGroups(); } catch { /* ignore */ }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <GroupsIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>จัดการกลุ่ม LINE หน่วยงาน</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          ออกรหัสจับคู่ แล้วนำไปพิมพ์ในกลุ่ม LINE (ที่เชิญบอทเข้าไปแล้ว) เพื่อรับการแจ้งเตือนเรื่องร้องเรียน
        </Typography>

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

        {/* Pairing code generator */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} mb={1}>
          {isAdmin && (
            <TextField
              select size="small" label="ขอบเขต" value={form.scope} sx={{ minWidth: 130 }}
              onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
            >
              <MenuItem value="center">ศูนย์ดำรงธรรม</MenuItem>
              <MenuItem value="agency">หน่วยงาน</MenuItem>
            </TextField>
          )}
          {form.scope === 'agency' && isAdmin && (
            <TextField
              select size="small" label="หน่วยงาน" value={form.agency_id} sx={{ minWidth: 200 }}
              onChange={(e) => setForm((p) => ({ ...p, agency_id: e.target.value }))}
            >
              {agencies.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </TextField>
          )}
          <TextField
            size="small" label="ชื่อกลุ่ม (ไม่บังคับ)" value={form.label} sx={{ minWidth: 180 }}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
          />
          <Button variant="contained" onClick={handleGenerate} disabled={busy}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'ออกรหัสจับคู่'}
          </Button>
        </Stack>

        {generated && (
          <Alert severity="success" sx={{ mb: 2 }}>
            รหัสจับคู่: <strong style={{ fontSize: '1.2em', letterSpacing: 2 }}>{generated.code}</strong>
            {' '}(หมดอายุใน {generated.ttl_minutes} นาที)<br />
            นำไปพิมพ์ในกลุ่ม LINE ที่เชิญบอทเข้าไปแล้ว เพื่อเชื่อมต่อ
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Bound groups */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
        ) : groups.length === 0 ? (
          <Typography variant="body2" color="text.secondary">ยังไม่มีกลุ่มที่เชื่อมต่อ</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>กลุ่ม</TableCell>
                  <TableCell>สถานะ</TableCell>
                  {EVENT_FLAGS.map((f) => <TableCell key={f.key} align="center">{f.label}</TableCell>)}
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{g.label || '(ไม่มีชื่อ)'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {g.scope === 'center' ? 'ศูนย์ดำรงธรรม' : (g.agency_name || 'หน่วยงาน')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={g.is_active ? 'ทำงาน' : 'ปิด'} color={g.is_active ? 'success' : 'default'} />
                      <Switch size="small" checked={Boolean(g.is_active)} onChange={toggleFlag(g, 'is_active')} />
                    </TableCell>
                    {EVENT_FLAGS.map((f) => (
                      <TableCell key={f.key} align="center">
                        <Switch size="small" checked={Boolean(g[f.key])} onChange={toggleFlag(g, f.key)} disabled={!g.is_active} />
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleUnbind(g)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LineGroupManager;
