import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
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
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ComplaintTimeline from '../../components/common/ComplaintTimeline';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import LocationMapPicker from '../../components/common/LocationMapPicker';
import * as complaintApi from '../../api/complaintApi';
import * as assignmentApi from '../../api/assignmentApi';
import * as agencyApi from '../../api/agencyApi';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatters';

// ── Role groups ───────────────────────────────────────────────
const CENTER_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER, ROLES.CHIEF];
const AGENCY_ROLES = [ROLES.AGENCY_HEAD, ROLES.AGENCY_OFFICER];
const CAN_SEE_PII = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER];

// ── Workflow Action Dialog ────────────────────────────────────
const ActionDialog = ({ open, onClose, onConfirm, title, fields = [], loading }) => {
  const [values, setValues] = useState({});
  const [options, setOptions] = useState({});

  useEffect(() => {
    if (open) {
      const init = {};
      fields.forEach((f) => { init[f.key] = f.default ?? ''; });
      setValues(init);
    }
  }, [open, fields]);

  useEffect(() => {
    fields.forEach((f) => {
      if (f.type === 'async_select' && open) {
        f.load().then((opts) => setOptions((p) => ({ ...p, [f.key]: opts }))).catch(() => {});
      }
    });
  }, [open, fields]);

  const handleChange = (key) => (e) => setValues((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {fields.map((f) => {
          if (f.type === 'text' || f.type === 'textarea') {
            return (
              <TextField
                key={f.key}
                fullWidth
                multiline={f.type === 'textarea'}
                minRows={f.type === 'textarea' ? 3 : 1}
                label={f.label}
                required={f.required}
                value={values[f.key] ?? ''}
                onChange={handleChange(f.key)}
                sx={{ mb: 2 }}
              />
            );
          }
          if (f.type === 'select' || f.type === 'async_select') {
            const opts = f.options || options[f.key] || [];
            return (
              <FormControl key={f.key} fullWidth required={f.required} sx={{ mb: 2 }}>
                <InputLabel>{f.label}</InputLabel>
                <Select
                  value={values[f.key] ?? ''}
                  label={f.label}
                  onChange={handleChange(f.key)}
                >
                  {opts.map((o) => (
                    <MenuItem key={o.value ?? o.id} value={o.value ?? o.id}>
                      {o.label ?? o.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          return null;
        })}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(values)}
          disabled={loading || fields.filter((f) => f.required && !values[f.key]).length > 0}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'ยืนยัน'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Info Row ─────────────────────────────────────────────────
const InfoRow = ({ label, value, children }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2">{children ?? value ?? '-'}</Typography>
  </Box>
);

// ── Main Page ─────────────────────────────────────────────────
const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [dialog, setDialog] = useState(null); // { type, title, fields, onConfirm }
  const [updateText, setUpdateText] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      complaintApi.getById(id),
      complaintApi.getTimeline(id),
      complaintApi.getAttachments(id),
      complaintApi.getAssignments(id),
    ])
      .then(([cRes, tRes, aRes, asRes]) => {
        // API returns { data: { complaint: {...} } }
        setComplaint(cRes.data?.data?.complaint || cRes.data?.data);
        setTimeline(tRes.data?.data?.timeline || []);
        setAttachments(aRes.data?.data?.attachments || []);
        setAssignments(asRes.data?.data?.assignments || []);
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (apiFn, payload) => {
    setActionLoading(true);
    setActionError('');
    try {
      await apiFn(payload);
      setDialog(null);
      load();
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const openDialog = (type) => {
    const defs = {
      screen: {
        title: 'เริ่มคัดกรอง',
        fields: [{ key: 'note', label: 'หมายเหตุ (ไม่บังคับ)', type: 'text' }],
        onConfirm: (v) => runAction(() => complaintApi.screen(id, v), v),
      },
      reject: {
        title: 'ปฏิเสธเรื่อง',
        fields: [{ key: 'rejection_reason', label: 'เหตุผล', type: 'textarea', required: true }],
        onConfirm: (v) => runAction(() => complaintApi.reject(id, v), v),
      },
      assign: {
        title: 'ส่งต่อหน่วยงาน',
        fields: [
          {
            key: 'agency_id',
            label: 'หน่วยงาน',
            type: 'async_select',
            required: true,
            load: () =>
              agencyApi.list().then((r) =>
                (r.data?.data?.agencies || []).filter((a) => a.is_active && !a.is_center)
              ),
          },
          { key: 'note', label: 'หมายเหตุ', type: 'text' },
        ],
        onConfirm: (v) => runAction(() => complaintApi.assign(id, { ...v, agency_id: Number(v.agency_id) }), v),
      },
      review: {
        title: 'เริ่มตรวจผล (RESOLVED → REVIEWING)',
        fields: [{ key: 'note', label: 'หมายเหตุ', type: 'text' }],
        onConfirm: (v) => runAction(() => complaintApi.review(id, v), v),
      },
      close: {
        title: 'ปิดเรื่อง',
        fields: [{ key: 'closed_summary', label: 'สรุปผลการดำเนินการ', type: 'textarea', required: true }],
        onConfirm: (v) => runAction(() => complaintApi.close(id, v), v),
      },
      selfHandle: {
        title: 'ศูนย์ดำรงธรรมจัดการเอง',
        fields: [{ key: 'note', label: 'หมายเหตุ (ไม่บังคับ)', type: 'text' }],
        onConfirm: (v) => runAction(() => complaintApi.selfHandle(id, v), v),
      },
      sendBack: {
        title: 'ส่งกลับให้หน่วยงานแก้ไข',
        fields: [{ key: 'note', label: 'เหตุผล', type: 'textarea', required: true }],
        onConfirm: (v) => runAction(() => complaintApi.sendBack(id, v), v),
      },
      accept: {
        title: 'รับเรื่อง',
        fields: [{ key: 'note', label: 'หมายเหตุ', type: 'text' }],
        onConfirm: (v) => {
          const a = assignments.find((x) => x.status === 'PENDING');
          if (!a) return;
          runAction(() => assignmentApi.accept(a.id, v), v);
        },
      },
      returnComplaint: {
        title: 'ส่งคืนเรื่อง',
        fields: [{ key: 'return_reason', label: 'เหตุผล', type: 'textarea', required: true }],
        onConfirm: (v) => {
          const a = assignments.find((x) => x.status === 'PENDING' || x.status === 'ACCEPTED');
          if (!a) return;
          runAction(() => assignmentApi.returnComplaint(a.id, v), v);
        },
      },
      start: {
        title: 'เริ่มดำเนินการ',
        fields: [{ key: 'note', label: 'หมายเหตุ', type: 'text' }],
        onConfirm: (v) => {
          const a = assignments.find((x) => x.status === 'ACCEPTED');
          if (!a) return;
          runAction(() => assignmentApi.start(a.id, v), v);
        },
      },
      resolve: {
        title: 'ส่งผลดำเนินการ',
        fields: [{ key: 'content', label: 'ผลการดำเนินการ', type: 'textarea', required: true }],
        onConfirm: (v) => {
          const a = assignments.find((x) => x.status === 'ACCEPTED');
          if (!a) return;
          runAction(() => assignmentApi.resolve(a.id, v), v);
        },
      },
      revealIdentity: {
        title: 'เปิดเผยตัวตนผู้ร้อง',
        fields: [{ key: 'reason', label: 'เหตุผลการเปิดเผย', type: 'textarea', required: true }],
        onConfirm: (v) => runAction(() => complaintApi.revealIdentity(id, v), v),
      },
    };
    setDialog({ type, ...defs[type] });
  };

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return;
    setUpdateLoading(true);
    setActionError('');
    try {
      await complaintApi.addUpdate(id, { content: updateText, update_type: 'NOTE' });

      // Upload pending files
      if (pendingFiles.length) {
        await Promise.all(
          pendingFiles.map((f) => {
            const fd = new FormData();
            fd.append('file', f);
            return complaintApi.uploadAttachment(id, fd).catch(() => {});
          })
        );
        setPendingFiles([]);
      }

      setUpdateText('');
      load();
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const res = await complaintApi.downloadAttachment(file.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name || `attachment-${file.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('ดาวน์โหลดไม่สำเร็จ');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!complaint) return null;

  const st = complaint.status;
  const role = user?.role;
  const isCenter = CENTER_ROLES.includes(role);
  const isAgency = AGENCY_ROLES.includes(role);
  const canSeePII = CAN_SEE_PII.includes(role) || role === ROLES.SUPER_ADMIN;
  const myAssignment = assignments.find((a) => a.is_active);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate('/complaints')}>
            กลับ
          </Button>
          <Typography variant="h6" fontWeight={700}>
            {complaint.complaint_number}
          </Typography>
          <StatusChip status={st} />
          <PriorityChip priority={complaint.priority} />
          {complaint.is_overdue && (
            <Chip icon={<WarningAmberIcon />} label="เกินกำหนด" color="error" size="small" />
          )}
          {complaint.is_anonymous && (
            <Chip label="ปกปิดตัวตน" size="small" color="warning" variant="outlined" />
          )}
        </Box>
        {isCenter && !['CLOSED', 'REJECTED'].includes(st) && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/complaints/${id}/edit`)}
          >
            แก้ไข
          </Button>
        )}
      </Box>

      {actionError && <ErrorAlert message={actionError} sx={{ mb: 2 }} />}

      {/* Workflow Actions */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            การดำเนินการ
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {isCenter && st === 'NEW' && (
              <Button variant="contained" size="small" onClick={() => openDialog('screen')}>
                เริ่มคัดกรอง (T-01)
              </Button>
            )}
            {isCenter && st === 'SCREENING' && (
              <>
                <Button variant="contained" size="small" color="success" onClick={() => openDialog('assign')}>
                  ส่งต่อหน่วยงาน (T-02)
                </Button>
                <Button variant="outlined" size="small" color="info" onClick={() => openDialog('selfHandle')}>
                  ศูนย์จัดการเอง
                </Button>
                <Button variant="outlined" size="small" color="error" onClick={() => openDialog('reject')}>
                  ปฏิเสธเรื่อง (T-03)
                </Button>
              </>
            )}
            {isCenter && st === 'RESOLVED' && (
              <Button variant="contained" size="small" onClick={() => openDialog('review')}>
                เริ่มตรวจผล (T-09)
              </Button>
            )}
            {isCenter && st === 'REVIEWING' && (
              <>
                <Button variant="contained" size="small" color="success" onClick={() => openDialog('close')}>
                  ปิดเรื่อง (T-10)
                </Button>
                <Button variant="outlined" size="small" color="warning" onClick={() => openDialog('sendBack')}>
                  ส่งกลับแก้ไข (T-11)
                </Button>
              </>
            )}
            {isCenter && st === 'IN_PROGRESS' && (!myAssignment || myAssignment.is_center) && (
              <Button variant="contained" size="small" color="success" onClick={() => openDialog('close')}>
                ปิดเรื่อง
              </Button>
            )}
            {isCenter && st === 'RETURNED' && (
              <Button variant="contained" size="small" onClick={() => openDialog('screen')}>
                เริ่มคัดกรองใหม่ (T-12)
              </Button>
            )}

            {isAgency && myAssignment?.status === 'PENDING' && (
              <>
                <Button variant="contained" size="small" color="success" onClick={() => openDialog('accept')}>
                  รับเรื่อง (T-04)
                </Button>
                <Button variant="outlined" size="small" color="error" onClick={() => openDialog('returnComplaint')}>
                  ส่งคืน (T-05)
                </Button>
              </>
            )}
            {isAgency && myAssignment?.status === 'ACCEPTED' && st === 'ACCEPTED' && (
              <>
                <Button variant="contained" size="small" onClick={() => openDialog('start')}>
                  เริ่มดำเนินการ (T-06)
                </Button>
                <Button variant="outlined" size="small" color="error" onClick={() => openDialog('returnComplaint')}>
                  ส่งคืน (T-07)
                </Button>
              </>
            )}
            {isAgency && myAssignment?.status === 'ACCEPTED' && st === 'IN_PROGRESS' && (
              <Button variant="contained" size="small" color="success" onClick={() => openDialog('resolve')}>
                ส่งผลดำเนินการ (T-08)
              </Button>
            )}

            {role === ROLES.SUPER_ADMIN && complaint.is_anonymous && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<LockOpenIcon />}
                onClick={() => openDialog('revealIdentity')}
              >
                เปิดเผยตัวตน
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="รายละเอียด" />
        <Tab label={`ประวัติ (${timeline.length})`} />
        <Tab label={`ไฟล์แนบ (${attachments.length})`} />
        {assignments.length > 0 && <Tab label="การมอบหมาย" />}
      </Tabs>

      {/* Tab 0: Detail */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>{complaint.title}</Typography>
                <Typography variant="body2" whiteSpace="pre-wrap" mb={2}>{complaint.description}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><InfoRow label="ประเภทงานบริการ" value={complaint.service_type_name} /></Grid>
                  <Grid item xs={6}><InfoRow label="ลักษณะเรื่อง" value={complaint.complaint_nature_name} /></Grid>
                  <Grid item xs={6}><InfoRow label="ช่องทางรับเรื่อง" value={complaint.channel_name} /></Grid>
                  <Grid item xs={6}><InfoRow label="ประเภทเรื่อง" value={complaint.category_name} /></Grid>
                  <Grid item xs={6}><InfoRow label="วันที่รับเรื่อง" value={formatDateTime(complaint.created_at)} /></Grid>
                  <Grid item xs={6}><InfoRow label="กำหนดแล้วเสร็จ" value={formatDate(complaint.due_date)} /></Grid>
                  {complaint.closed_at && (
                    <Grid item xs={6}><InfoRow label="วันที่ปิดเรื่อง" value={formatDateTime(complaint.closed_at)} /></Grid>
                  )}
                </Grid>

                {complaint.latitude && complaint.longitude && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">พิกัดจุดเกิดเหตุ</Typography>
                    <Box mt={1}>
                      <LocationMapPicker
                        latitude={complaint.latitude}
                        longitude={complaint.longitude}
                        readOnly
                      />
                    </Box>
                  </Box>
                )}

                {complaint.rejection_reason && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    เหตุผลการปฏิเสธ: {complaint.rejection_reason}
                  </Alert>
                )}
                {complaint.closed_summary && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    สรุปผล: {complaint.closed_summary}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Complainant Info */}
          <Grid item xs={12} md={5}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>ข้อมูลผู้ร้อง</Typography>
                {complaint.is_anonymous && !canSeePII ? (
                  <Alert severity="warning" icon={false}>
                    เรื่องนี้ปกปิดตัวตน — ข้อมูลผู้ร้องถูกซ่อน
                  </Alert>
                ) : (
                  <>
                    <InfoRow label="ชื่อ-นามสกุล" value={complaint.complainant_name || (complaint.is_anonymous ? '[ปกปิดตัวตน]' : '-')} />
                    <InfoRow label="ประเภทผู้ร้อง" value={complaint.complainant_type_name} />
                    {canSeePII && (
                      <>
                        <InfoRow label="เบอร์โทรศัพท์" value={complaint.complainant_phone} />
                        <InfoRow label="เลขบัตรประชาชน" value={complaint.complainant_id_card} />
                        <InfoRow label="อีเมล" value={complaint.complainant_email} />
                        <InfoRow label="ที่อยู่" value={complaint.complainant_address} />
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {(complaint.province_name || complaint.incident_address) && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>จุดเกิดเหตุ</Typography>
                  <InfoRow label="จังหวัด" value={complaint.province_name} />
                  <InfoRow label="อำเภอ" value={complaint.district_name} />
                  <InfoRow label="ตำบล" value={complaint.subdistrict_name} />
                  <InfoRow label="รหัสไปรษณีย์" value={complaint.postal_code} />
                  <InfoRow label="สถานที่" value={complaint.incident_address} />
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Add Update */}
          {(isCenter || isAgency) && !['CLOSED', 'REJECTED'].includes(st) && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>เพิ่มบันทึก / ความคืบหน้า</Typography>
                  {actionError && <ErrorAlert message={actionError} sx={{ mb: 1 }} />}
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="บันทึกความคืบหน้าหรือหมายเหตุ..."
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    disabled={updateLoading}
                    sx={{ mb: 1 }}
                  />
                  <FileUpload
                    files={pendingFiles}
                    onAdd={(files) => setPendingFiles((p) => [...p, ...files])}
                    onRemove={(idx) => setPendingFiles((p) => p.filter((_, i) => i !== idx))}
                    disabled={updateLoading}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddUpdate}
                    disabled={updateLoading || !updateText.trim()}
                    sx={{ mt: 1 }}
                  >
                    {updateLoading ? <CircularProgress size={16} color="inherit" /> : 'บันทึก'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab 1: Timeline */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <ComplaintTimeline events={timeline} />
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Attachments */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <FileUpload
              files={attachments}
              onDownload={handleDownload}
              readOnly
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Assignments */}
      {tab === 3 && assignments.length > 0 && (
        <Card>
          <CardContent>
            {assignments.map((a) => (
              <Box key={a.id} mb={2} p={1.5} border="1px solid" borderColor="divider" borderRadius={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">{a.agency_name}</Typography>
                  <Chip label={STATUS_LABELS[a.status] || a.status} size="small" />
                </Box>
                {a.note && <Typography variant="body2" color="text.secondary" mt={0.5}>{a.note}</Typography>}
                <Typography variant="caption" color="text.disabled">
                  มอบหมาย: {formatDateTime(a.assigned_at)}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      {dialog && (
        <ActionDialog
          open={Boolean(dialog)}
          onClose={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          fields={dialog.fields}
          loading={actionLoading}
        />
      )}
    </Box>
  );
};

export default ComplaintDetailPage;
