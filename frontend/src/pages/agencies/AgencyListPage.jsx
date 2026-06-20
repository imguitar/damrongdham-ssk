import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useAuth } from '../../contexts/AuthContext';
import * as agencyApi from '../../api/agencyApi';
import { ROLES } from '../../utils/constants';

const EMPTY_FORM = { name: '', short_name: '', contact_phone: '', contact_email: '', address: '' };

const AgencyListPage = () => {
  const { user } = useAuth();
  const isAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role);

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    agencyApi.list()
      .then((r) => setAgencies(r.data?.data?.agencies || []))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (agency) => {
    setEditTarget(agency);
    setForm({
      name: agency.name || '', short_name: agency.short_name || '',
      contact_phone: agency.contact_phone || '', contact_email: agency.contact_email || '',
      address: agency.address || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await agencyApi.update(editTarget.id, form);
      } else {
        await agencyApi.create(form);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try { await agencyApi.toggleStatus(toggleTarget.id); setToggleTarget(null); load(); }
    catch { setError('เกิดข้อผิดพลาด'); }
  };

  const columns = [
    { key: 'name', label: 'ชื่อหน่วยงาน' },
    { key: 'short_name', label: 'ชื่อย่อ', width: 120, render: (r) => r.short_name || '-' },
    { key: 'contact_phone', label: 'โทรศัพท์', width: 140, render: (r) => r.contact_phone || '-' },
    {
      key: 'is_active',
      label: 'สถานะ',
      width: 90,
      render: (r) => <Chip label={r.is_active ? 'ใช้งาน' : 'ปิดใช้'} color={r.is_active ? 'success' : 'default'} size="small" />,
    },
    isAdmin ? {
      key: 'actions',
      label: '',
      width: 90,
      render: (r) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="แก้ไข">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={r.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}>
            <IconButton size="small" color={r.is_active ? 'error' : 'success'}
              onClick={(e) => { e.stopPropagation(); setToggleTarget(r); }}>
              {r.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    } : null,
  ].filter(Boolean);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>จัดการหน่วยงาน</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            เพิ่มหน่วยงาน
          </Button>
        )}
      </Box>

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      <DataTable
        columns={columns}
        rows={agencies}
        loading={loading}
        total={agencies.length}
        emptyText="ยังไม่มีหน่วยงาน"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'แก้ไขหน่วยงาน' : 'เพิ่มหน่วยงาน'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="ชื่อหน่วยงาน" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                size="small" disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="ชื่อย่อ" value={form.short_name}
                onChange={(e) => setForm((p) => ({ ...p, short_name: e.target.value }))}
                size="small" disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="โทรศัพท์" value={form.contact_phone}
                onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
                size="small" disabled={saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="อีเมล" type="email" value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                size="small" disabled={saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline minRows={2} label="ที่อยู่" value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                size="small" disabled={saving}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} disabled={saving}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.is_active ? 'ปิดใช้งานหน่วยงาน' : 'เปิดใช้งานหน่วยงาน'}
        message={`ต้องการ${toggleTarget?.is_active ? 'ปิด' : 'เปิด'}ใช้งาน "${toggleTarget?.name}" ใช่หรือไม่?`}
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </Box>
  );
};

export default AgencyListPage;
