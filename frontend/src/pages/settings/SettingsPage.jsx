import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import * as masterDataApi from '../../api/masterDataApi';

// ── Generic CRUD Table for simple master data ─────────────────────────────────
const MasterDataTable = ({ items, onEdit, onToggle, isAdmin }) => (
  <Paper variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>ชื่อ</TableCell>
          {items[0]?.sla_days !== undefined && <TableCell width={100}>SLA (วัน)</TableCell>}
          <TableCell width={90}>สถานะ</TableCell>
          {isAdmin && <TableCell width={90} />}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} hover>
            <TableCell>
              <Typography variant="body2">{item.name}</Typography>
              {item.description && (
                <Typography variant="caption" color="text.secondary">{item.description}</Typography>
              )}
            </TableCell>
            {item.sla_days !== undefined && <TableCell>{item.sla_days}</TableCell>}
            <TableCell>
              <Chip
                label={item.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                color={item.is_active ? 'success' : 'default'}
                size="small"
              />
            </TableCell>
            {isAdmin && (
              <TableCell>
                <Box display="flex" gap={0.5}>
                  <Tooltip title="แก้ไข">
                    <IconButton size="small" onClick={() => onEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}>
                    <IconButton
                      size="small"
                      color={item.is_active ? 'error' : 'success'}
                      onClick={() => onToggle(item)}
                    >
                      {item.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            )}
          </TableRow>
        ))}
        {!items.length && (
          <TableRow>
            <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.disabled' }}>
              ไม่มีข้อมูล
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Paper>
);

// ── Tab Config ─────────────────────────────────────────────────────────────────
const TABS = [
  {
    label: 'ประเภทเรื่อง',
    listFn: () => masterDataApi.listCategories().then((r) => r.data?.data?.categories || []),
    createFn: masterDataApi.createCategory,
    updateFn: masterDataApi.updateCategory,
    toggleFn: masterDataApi.toggleCategory,
    hasDescription: true,
    hasSla: true,
  },
  {
    label: 'ช่องทางรับเรื่อง',
    listFn: () => masterDataApi.listChannels().then((r) => r.data?.data?.channels || []),
    createFn: masterDataApi.createChannel,
    updateFn: masterDataApi.updateChannel,
    toggleFn: masterDataApi.toggleChannel,
    hasDescription: false,
  },
  {
    label: 'ประเภทงานบริการ',
    listFn: () => masterDataApi.listServiceTypes().then((r) => r.data?.data?.service_types || []),
    createFn: masterDataApi.createServiceType,
    updateFn: masterDataApi.updateServiceType,
    toggleFn: masterDataApi.toggleServiceType,
    hasDescription: true,
  },
  {
    label: 'ลักษณะเรื่อง',
    listFn: () => masterDataApi.listComplaintNatures().then((r) => r.data?.data?.complaint_natures || []),
    createFn: masterDataApi.createComplaintNature,
    updateFn: masterDataApi.updateComplaintNature,
    toggleFn: masterDataApi.toggleComplaintNature,
    hasDescription: false,
  },
  {
    label: 'ประเภทผู้ร้อง',
    listFn: () => masterDataApi.listComplainantTypes().then((r) => r.data?.data?.complainant_types || []),
    createFn: masterDataApi.createComplainantType,
    updateFn: masterDataApi.updateComplainantType,
    toggleFn: masterDataApi.toggleComplainantType,
    hasDescription: false,
  },
];

const SettingsPage = () => {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sla_days: '' });
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);

  const cfg = TABS[tab];

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    cfg.listFn()
      .then(setItems)
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [cfg]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', description: '', sla_days: '' });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ name: item.name, description: item.description || '', sla_days: item.sla_days || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        ...(cfg.hasDescription ? { description: form.description || null } : {}),
        ...(cfg.hasSla ? { sla_days: Number(form.sla_days) || null } : {}),
      };
      if (editTarget) {
        await cfg.updateFn(editTarget.id, payload);
      } else {
        await cfg.createFn(payload);
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
    try { await cfg.toggleFn(toggleTarget.id); setToggleTarget(null); load(); }
    catch { setError('เกิดข้อผิดพลาด'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>ตั้งค่า Master Data</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          เพิ่ม
        </Button>
      </Box>

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setItems([]); }}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {TABS.map((t) => <Tab key={t.label} label={t.label} />)}
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <MasterDataTable
          items={items}
          onEdit={openEdit}
          onToggle={setToggleTarget}
          isAdmin
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? `แก้ไข${cfg.label}` : `เพิ่ม${cfg.label}`}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth required label="ชื่อ" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            size="small" disabled={saving} sx={{ mt: 1, mb: 2 }}
          />
          {cfg.hasDescription && (
            <TextField
              fullWidth label="คำอธิบาย" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              size="small" disabled={saving} multiline minRows={2} sx={{ mb: 2 }}
            />
          )}
          {cfg.hasSla && (
            <TextField
              label="SLA (วัน)" type="number" value={form.sla_days}
              onChange={(e) => setForm((p) => ({ ...p, sla_days: e.target.value }))}
              size="small" disabled={saving} sx={{ width: 160 }}
              inputProps={{ min: 1, max: 365 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} disabled={saving}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
        message={`ต้องการ${toggleTarget?.is_active ? 'ปิด' : 'เปิด'}ใช้งาน "${toggleTarget?.name}" ใช่หรือไม่?`}
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </Box>
  );
};

export default SettingsPage;
