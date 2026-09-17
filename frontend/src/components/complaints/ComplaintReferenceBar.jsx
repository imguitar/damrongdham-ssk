import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import * as complaintApi from '../../api/complaintApi';
import { alertError, toastSuccess } from '../../utils/alert';

const MAX_LENGTH = 100;

const Field = ({ label, hint, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    {children}
    {hint && (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, opacity: 0.8 }}>
        {hint}
      </Typography>
    )}
  </Box>
);

// เลขเอกสารภายใน / รหัสติดตามของประชาชน / เลขเอกสารอ้างอิงของหน่วยงาน
const ComplaintReferenceBar = ({ complaint, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setValue(complaint.reference_number || '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await complaintApi.updateReferenceNumber(complaint.id, value.trim());
      onUpdated?.(res.data?.data?.reference_number ?? null);
      toastSuccess('บันทึกเลขเอกสารอ้างอิงแล้ว');
      setEditing(false);
    } catch (err) {
      alertError(err, { title: 'บันทึกเลขเอกสารอ้างอิงไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  const copyTrackingCode = async () => {
    try {
      await navigator.clipboard.writeText(complaint.tracking_code);
      toastSuccess('คัดลอกรหัสติดตามแล้ว');
    } catch {
      // clipboard ไม่พร้อมใช้งาน (เช่น http) — ไม่ต้องแจ้ง
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'auto auto minmax(0, 1fr)' },
            alignItems: 'start',
            columnGap: 4,
          }}
        >
          <Field label="เลขที่เอกสาร (ภายใน)" hint="เห็นเฉพาะเจ้าหน้าที่">
            <Typography fontWeight={600}>{complaint.complaint_number}</Typography>
          </Field>

          <Field label="รหัสติดตามของประชาชน" hint="ผู้ร้องใช้รหัสนี้ติดตามสถานะ">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography fontWeight={700} letterSpacing={3} color="primary.main">
                {complaint.tracking_code || '-'}
              </Typography>
              {complaint.tracking_code && (
                <Tooltip title="คัดลอก">
                  <IconButton size="small" onClick={copyTrackingCode} aria-label="คัดลอกรหัสติดตาม">
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Field>

          <Field label="เลขเอกสารอ้างอิง (ระบบภายในหน่วยงาน)">
            {editing ? (
              <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                <TextField
                  size="small"
                  fullWidth
                  autoFocus
                  placeholder="เช่น ศก 0017.2/1234"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') save();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  disabled={saving}
                  inputProps={{ maxLength: MAX_LENGTH }}
                />
                <Button variant="contained" size="small" onClick={save} disabled={saving}>
                  {saving ? <CircularProgress size={16} color="inherit" /> : 'บันทึก'}
                </Button>
                <Button size="small" onClick={() => setEditing(false)} disabled={saving}>
                  ยกเลิก
                </Button>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography
                  fontWeight={complaint.reference_number ? 600 : 400}
                  color={complaint.reference_number ? 'text.primary' : 'text.secondary'}
                  sx={{ wordBreak: 'break-word' }}
                >
                  {complaint.reference_number || 'ยังไม่ได้ระบุ'}
                </Typography>
                <Tooltip title={complaint.reference_number ? 'แก้ไข' : 'เพิ่มเลขเอกสารอ้างอิง'}>
                  <IconButton size="small" onClick={startEdit} aria-label="แก้ไขเลขเอกสารอ้างอิง">
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Field>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComplaintReferenceBar;
