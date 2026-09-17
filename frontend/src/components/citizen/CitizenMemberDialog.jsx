import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import StatusChip from '../common/StatusChip';
import * as citizenAdminApi from '../../api/citizenAdminApi';
import { formatDateTime } from '../../utils/formatters';
import { alertError, confirmAction, extractError, toastSuccess } from '../../utils/alert';
import { digitsOnly, isValidThaiIdCard, isValidThaiPhone } from '../../utils/thaiValidators';

const Info = ({ label, children }) => (
  <Box mb={1.25}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{children || '-'}</Typography>
  </Box>
);

const toForm = (c) => ({
  full_name: c?.full_name || '',
  phone: c?.phone || '',
  id_card: c?.id_card || '',
  address: c?.address || '',
});

// รายละเอียด + แก้ไขข้อมูลสมาชิกประชาชน (super_admin)
// ผู้เรียกควรใส่ key={citizenId} เพื่อให้ state เริ่มใหม่ทุกครั้งที่เปิดสมาชิกคนอื่น
const CitizenMemberDialog = ({ citizenId, onClose, onChanged }) => {
  const [citizen, setCitizen] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(toForm(null));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!citizenId) return;
    citizenAdminApi.getById(citizenId)
      .then((res) => {
        const c = res.data?.data?.citizen;
        setCitizen(c);
        setForm(toForm(c));
      })
      .catch((err) => setLoadError(extractError(err, 'โหลดข้อมูลสมาชิกไม่สำเร็จ')));
  }, [citizenId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const clean = name === 'phone' || name === 'id_card' ? digitsOnly(value) : value;
    setForm((p) => ({ ...p, [name]: clean }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const dirty = citizen && JSON.stringify(form) !== JSON.stringify(toForm(citizen));

  const handleSave = async () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'กรุณาระบุชื่อ-นามสกุล';
    if (form.phone && !isValidThaiPhone(form.phone)) e.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    if (form.id_card && !isValidThaiIdCard(form.id_card)) e.id_card = 'เลขบัตรประชาชนไม่ถูกต้อง (13 หลัก)';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res = await citizenAdminApi.update(citizen.id, form);
      const updated = res.data?.data?.citizen;
      setCitizen(updated);
      setForm(toForm(updated));
      toastSuccess('บันทึกข้อมูลสมาชิกแล้ว');
      onChanged?.();
    } catch (err) {
      alertError(err, { title: 'บันทึกข้อมูลไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const activate = !citizen.is_active;
    const ok = await confirmAction({
      title: activate ? 'เปิดใช้งานบัญชี' : 'ระงับการใช้งานบัญชี',
      text: activate
        ? `เปิดใช้งานบัญชีของ "${citizen.full_name}" อีกครั้ง?`
        : `ระงับบัญชีของ "${citizen.full_name}"? สมาชิกจะเข้าสู่ระบบและใช้งานหน้าสมาชิกไม่ได้ทันที (เรื่องร้องเรียนเดิมยังอยู่ในระบบ)`,
      confirmText: activate ? 'เปิดใช้งาน' : 'ระงับบัญชี',
      icon: 'warning',
      danger: !activate,
    });
    if (!ok) return;
    setToggling(true);
    try {
      await citizenAdminApi.setStatus(citizen.id, activate);
      setCitizen((c) => ({ ...c, is_active: activate ? 1 : 0 }));
      toastSuccess(activate ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับบัญชีแล้ว');
      onChanged?.();
    } catch (err) {
      alertError(err, { title: 'เปลี่ยนสถานะบัญชีไม่สำเร็จ' });
    } finally {
      setToggling(false);
    }
  };

  const line = citizen?.identities?.find((i) => i.provider === 'line');

  return (
    <Dialog open={Boolean(citizenId)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        ข้อมูลสมาชิกประชาชน
        {citizen && (
          <>
            <Chip size="small" label={citizen.is_active ? 'ใช้งาน' : 'ระงับ'} color={citizen.is_active ? 'success' : 'default'} />
            {!!citizen.is_provisional && <Chip size="small" label="ยังกรอกข้อมูลไม่ครบ" color="warning" variant="outlined" />}
          </>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loadError && <Alert severity="error">{loadError}</Alert>}
        {!citizen && !loadError && (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        )}

        {citizen && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>บัญชี</Typography>
              <Info label="อีเมล">{citizen.email}</Info>
              <Info label="ช่องทางเข้าสู่ระบบ">
                {[citizen.has_password ? 'อีเมล/รหัสผ่าน' : null, line ? 'LINE' : null].filter(Boolean).join(', ')}
              </Info>
              {line && (
                <Box display="flex" alignItems="center" gap={1} mb={1.25}>
                  <Avatar src={line.picture_url || undefined} sx={{ width: 32, height: 32 }} />
                  <Box>
                    <Typography variant="body2">{line.display_name || 'บัญชี LINE'}</Typography>
                    <Typography variant="caption" color="text.secondary">ผูก LINE เมื่อ {formatDateTime(line.linked_at)}</Typography>
                  </Box>
                </Box>
              )}
              <Info label="สมัครเมื่อ">{formatDateTime(citizen.created_at)}</Info>
              <Info label="เข้าสู่ระบบล่าสุด">{citizen.last_login_at ? formatDateTime(citizen.last_login_at) : null}</Info>
              <Info label="ยินยอมประกาศความเป็นส่วนตัว">{citizen.consent_at ? formatDateTime(citizen.consent_at) : 'ยังไม่ยินยอม'}</Info>
            </Grid>

            <Grid item xs={12} md={7}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>ข้อมูลส่วนตัว</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="ชื่อ-นามสกุล *" name="full_name" value={form.full_name}
                    onChange={handleChange} disabled={saving} error={Boolean(errors.full_name)} helperText={errors.full_name}
                    inputProps={{ maxLength: 255 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="เลขบัตรประชาชน" name="id_card" value={form.id_card}
                    onChange={handleChange} disabled={saving} error={Boolean(errors.id_card)} helperText={errors.id_card}
                    inputProps={{ inputMode: 'numeric', maxLength: 13 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="เบอร์โทรศัพท์" name="phone" value={form.phone}
                    onChange={handleChange} disabled={saving} error={Boolean(errors.phone)} helperText={errors.phone}
                    inputProps={{ inputMode: 'numeric', maxLength: 10 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" multiline minRows={2} label="ที่อยู่" name="address" value={form.address}
                    onChange={handleChange} disabled={saving} />
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                อีเมลและรหัสผ่านแก้ไขได้โดยสมาชิกเท่านั้น
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                เรื่องร้องเรียนของสมาชิก ({citizen.complaint_count})
              </Typography>
              {citizen.complaints?.length ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>เลขที่</TableCell>
                        <TableCell>รหัสติดตาม</TableCell>
                        <TableCell>หัวเรื่อง</TableCell>
                        <TableCell>สถานะ</TableCell>
                        <TableCell>วันที่ยื่น</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {citizen.complaints.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Link component={RouterLink} to={`/complaints/${c.id}`} underline="hover">{c.complaint_number}</Link>
                          </TableCell>
                          <TableCell>{c.tracking_code || '-'}</TableCell>
                          <TableCell>{c.title}</TableCell>
                          <TableCell><StatusChip status={c.status} /></TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(c.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">ยังไม่มีเรื่องร้องเรียน</Typography>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        {citizen && (
          <Button
            color={citizen.is_active ? 'error' : 'success'}
            variant="outlined"
            onClick={handleToggle}
            disabled={toggling || saving}
            sx={{ mr: 'auto' }}
          >
            {citizen.is_active ? 'ระงับบัญชี' : 'เปิดใช้งานบัญชี'}
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>ปิด</Button>
        {citizen && (
          <Button variant="contained" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'บันทึกข้อมูล'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CitizenMemberDialog;
