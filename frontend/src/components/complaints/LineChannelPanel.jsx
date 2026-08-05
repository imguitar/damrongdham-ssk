import { useCallback, useEffect, useState } from 'react';
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
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as complaintApi from '../../api/complaintApi';
import ErrorAlert from '../common/ErrorAlert';
import { formatDate, formatDateTime } from '../../utils/formatters';

// แผงจัดการช่องทาง LINE ของเรื่องร้องเรียน (ระบบหลังบ้าน)
// แสดงสถานะการผูกบัญชี ประวัติข้อความที่ระบบส่ง คำขอข้อมูลเพิ่มเติม
// เอกสารที่ประชาชนส่งเพิ่ม และปุ่มส่งข้อความใหม่ตามสิทธิ์

const EVENT_LABELS = {
  COMPLAINT_STATUS_CHANGED: 'แจ้งเปลี่ยนสถานะ',
  COMPLAINT_PROGRESS_UPDATED: 'แจ้งความคืบหน้า',
  COMPLAINT_MORE_INFO_REQUIRED: 'ขอข้อมูลเพิ่มเติม',
  COMPLAINT_RESOLVED: 'แจ้งผลดำเนินการ',
  COMPLAINT_CLOSED: 'แจ้งปิดเรื่อง',
};

const REQUEST_STATUS = {
  PENDING: { label: 'รอข้อมูลจากผู้ร้อง', color: 'warning' },
  RESPONDED: { label: 'ผู้ร้องส่งข้อมูลแล้ว', color: 'success' },
  CANCELLED: { label: 'ยกเลิกแล้ว', color: 'default' },
};

const eventLabel = (t) => EVENT_LABELS[t] || t;

const LineChannelPanel = ({ complaintId, canRequestInfo = false, canNotify = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ message: '', due_date: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complaintApi.getLineOverview(complaintId);
      setData(res.data?.data || null);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลช่องทาง LINE ได้');
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, successMsg) => {
    setBusy(true);
    setNotice('');
    setErrorMsg('');
    try {
      await fn();
      setNotice(successMsg);
      await load();
      return true;
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'ดำเนินการไม่สำเร็จ');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitRequest = async () => {
    if (!form.message.trim()) {
      setErrorMsg('กรุณาระบุรายการข้อมูลหรือเอกสารที่ต้องการ');
      return;
    }
    const ok = await act(
      () => complaintApi.createInfoRequest(complaintId, {
        message: form.message.trim(),
        due_date: form.due_date || null,
      }),
      'บันทึกคำขอข้อมูลเพิ่มเติมและส่งเข้าคิวแจ้งเตือนแล้ว'
    );
    if (ok) {
      setDialogOpen(false);
      setForm({ message: '', due_date: '' });
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;
  }

  if (!data) return <ErrorAlert message={errorMsg || 'ไม่พบข้อมูล'} />;

  const { channel, citizen, notification_logs: logs = [], notification_pending: pending = [],
    info_requests: infoRequests = [], documents = [] } = data;
  const lastLog = logs[0];

  return (
    <Grid container spacing={2}>
      {errorMsg && <Grid item xs={12}><ErrorAlert message={errorMsg} /></Grid>}
      {notice && <Grid item xs={12}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Grid>}

      {/* สถานะช่องทาง + บัญชี LINE ของผู้ร้อง */}
      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <ChatIcon sx={{ color: '#06C755' }} />
              <Typography variant="subtitle1" fontWeight={700}>ช่องทาง LINE</Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="body2" color="text.secondary">ช่องทางรับเรื่อง:</Typography>
              <Chip size="small" label={channel?.name || '-'} color={channel?.is_line ? 'success' : 'default'} />
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="body2" color="text.secondary">การผูกบัญชี LINE ของผู้ร้อง:</Typography>
              <Chip
                size="small"
                label={citizen?.linked ? 'ผูกแล้ว' : 'ยังไม่ผูก'}
                color={citizen?.linked ? 'success' : 'default'}
              />
            </Box>
            {citizen?.display_name && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                ชื่อบัญชี LINE: {citizen.display_name}
              </Typography>
            )}
            {citizen?.linked && citizen?.oa_friend === false && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                ผู้ร้องยังไม่ได้เพิ่มบัญชีทางการ (OA) เป็นเพื่อน หรือบล็อกไว้ — ส่งข้อความทาง LINE ไม่ได้
                (แนะนำให้ติดต่อทางโทรศัพท์แทน)
              </Alert>
            )}
            {citizen?.linked && !citizen?.notifications_enabled && (
              <Alert severity="info" sx={{ mb: 1 }}>ผู้ร้องปิดรับการแจ้งเตือนทาง LINE ไว้</Alert>
            )}
            {!citizen?.linked && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                ผู้ร้องยังไม่ได้ผูกบัญชี LINE — ระบบจะส่งข้อความผ่าน LINE ไม่ได้
              </Alert>
            )}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              ส่งข้อความล่าสุด: {lastLog ? formatDateTime(lastLog.sent_at || lastLog.created_at) : 'ยังไม่มี'}
            </Typography>
            {lastLog?.status === 'failed' && (
              <Alert severity="error" sx={{ mt: 1 }}>
                ส่งไม่สำเร็จ ({lastLog.error_code || 'ไม่ทราบสาเหตุ'}) {lastLog.error_message || ''}
              </Alert>
            )}
            {pending.length > 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                มีข้อความรอส่ง {pending.length} รายการ (ระบบส่งอัตโนมัติภายใน 1 นาที)
              </Alert>
            )}

            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={busy}>
                รีเฟรช
              </Button>
              {canNotify && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={busy || !citizen?.linked || citizen?.oa_friend === false}
                  onClick={() => act(() => complaintApi.notifyLine(complaintId), 'ส่งการแจ้งสถานะเข้าคิวแล้ว')}
                >
                  ส่งแจ้งสถานะปัจจุบันอีกครั้ง
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* ประวัติข้อความที่ระบบส่ง */}
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>ประวัติข้อความที่ระบบส่งทาง LINE</Typography>
            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">ยังไม่มีการส่งข้อความสำหรับเรื่องนี้</Typography>
            ) : (
              <List dense disablePadding>
                {logs.map((log) => (
                  <ListItem key={log.id} disableGutters divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body2" fontWeight={600}>{eventLabel(log.event_type)}</Typography>
                          <Chip
                            size="small"
                            label={log.status === 'sent' ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ'}
                            color={log.status === 'sent' ? 'success' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          {formatDateTime(log.sent_at || log.created_at)}
                          {log.status === 'failed' && ` · ${log.error_code || ''} ${log.error_message || ''}`}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* คำขอข้อมูลเพิ่มเติม */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>คำขอข้อมูล/เอกสารเพิ่มเติม</Typography>
              {canRequestInfo && (
                <Button size="small" variant="contained" onClick={() => setDialogOpen(true)} disabled={busy}>
                  ขอข้อมูลเพิ่มเติม
                </Button>
              )}
            </Box>

            {infoRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">ยังไม่มีคำขอข้อมูลเพิ่มเติม</Typography>
            ) : (
              infoRequests.map((r) => {
                const st = REQUEST_STATUS[r.status] || { label: r.status, color: 'default' };
                return (
                  <Box key={r.id} mb={2} p={1.5} border="1px solid" borderColor="divider" borderRadius={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                      <Chip size="small" label={st.label} color={st.color} />
                      <Typography variant="caption" color="text.secondary">
                        ขอโดย {r.requested_by_name || '-'} · {formatDateTime(r.created_at)}
                        {r.due_date ? ` · ครบกำหนด ${formatDate(r.due_date)}` : ''}
                        {r.notify_count > 1 ? ` · ส่งแล้ว ${r.notify_count} ครั้ง` : ''}
                      </Typography>
                    </Box>
                    <Typography variant="body2" whiteSpace="pre-wrap" mb={1}>{r.message}</Typography>

                    {(r.responses || []).length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary">ข้อมูลที่ผู้ร้องส่งกลับ</Typography>
                        <List dense disablePadding>
                          {r.responses.map((resp) => (
                            <ListItem key={resp.id} disableGutters>
                              <ListItemText
                                primary={resp.message || `ไฟล์แนบ: ${resp.file_name || '-'}`}
                                secondary={formatDateTime(resp.created_at)}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}

                    {canRequestInfo && r.status === 'PENDING' && (
                      <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={busy}
                          onClick={() => act(() => complaintApi.resendInfoRequest(complaintId, r.id), 'ส่งคำขอซ้ำเข้าคิวแล้ว')}
                        >
                          ส่งซ้ำ
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={busy}
                          onClick={() => act(() => complaintApi.cancelInfoRequest(complaintId, r.id), 'ยกเลิกคำขอแล้ว')}
                        >
                          ยกเลิกคำขอ
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* เอกสารที่ประชาชนส่งเข้ามา */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              เอกสาร/ไฟล์ที่ประชาชนส่งเข้ามา ({documents.length})
            </Typography>
            {documents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">ยังไม่มีไฟล์จากประชาชน</Typography>
            ) : (
              <List dense disablePadding>
                {documents.map((d) => (
                  <ListItem key={d.id} disableGutters divider>
                    <ListItemText
                      primary={d.file_name}
                      secondary={`${formatDateTime(d.created_at)} · ${Math.round((d.file_size || 0) / 1024)} KB · ช่องทาง ${d.upload_source}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Typography variant="caption" color="text.secondary">
              ดาวน์โหลดไฟล์ได้ที่แท็บ "ไฟล์แนบ" (ระบบตรวจสอบสิทธิ์ก่อนทุกครั้ง)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Dialog: ขอข้อมูลเพิ่มเติม */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ขอข้อมูล/เอกสารเพิ่มเติมจากผู้ร้อง</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            ข้อความนี้จะถูกส่งถึงผู้ร้องทาง LINE — กรุณาระบุเฉพาะรายการที่ต้องการ
            และหลีกเลี่ยงข้อมูลภายในหรือข้อมูลส่วนบุคคลของบุคคลอื่น
          </Alert>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="รายการข้อมูล/เอกสารที่ต้องการ"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            inputProps={{ maxLength: 1000 }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="กำหนดส่งภายใน (ถ้ามี)"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={busy}>ยกเลิก</Button>
          <Button variant="contained" onClick={submitRequest} disabled={busy}>ส่งคำขอ</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default LineChannelPanel;
