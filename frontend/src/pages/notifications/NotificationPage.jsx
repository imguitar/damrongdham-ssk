import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import * as notificationApi from '../../api/notificationApi';
import { useNotification } from '../../contexts/NotificationContext';
import { extractError, toastError } from '../../utils/alert';
import { formatDateTime } from '../../utils/formatters';

// ป้ายหมวดหมู่ (badge สี) ตามประเภทการแจ้งเตือน — ให้ดูแยกประเภทได้ทันทีเหมือนดีไซน์อ้างอิง
const TYPE_META = {
  WORKFLOW_ASSIGNED:      { label: 'มอบหมายงาน',   color: '#1565C0' },
  WORKFLOW_ACCEPTED:      { label: 'รับเรื่อง',     color: '#0288D1' },
  WORKFLOW_STARTED:       { label: 'เริ่มดำเนินการ', color: '#0288D1' },
  WORKFLOW_RESOLVED:      { label: 'ส่งผล',         color: '#2E7D32' },
  WORKFLOW_REVIEWING:     { label: 'ตรวจผล',        color: '#6A1B9A' },
  WORKFLOW_RETURNED:      { label: 'ส่งคืน',        color: '#E65100' },
  WORKFLOW_SENT_BACK:     { label: 'ส่งคืนแก้ไข',    color: '#E65100' },
  WORKFLOW_CLOSED:        { label: 'ปิดเรื่อง',      color: '#2E7D32' },
  WORKFLOW_SELF_HANDLED:  { label: 'ดำเนินการเอง',  color: '#0288D1' },
  SLA_NEAR_DUE:           { label: 'ใกล้ครบกำหนด',  color: '#F57C00' },
  SLA_OVERDUE:            { label: 'เกินกำหนด',      color: '#E53935' },
  ESCALATION_L1:          { label: 'เร่งรัด',        color: '#EF5350' },
  ESCALATION_L2:          { label: 'เร่งรัด',        color: '#E53935' },
  ESCALATION_L3:          { label: 'เร่งรัดสูงสุด',   color: '#B71C1C' },
  INFO_RESPONSE_RECEIVED: { label: 'ข้อมูลเพิ่มเติม', color: '#6A1B9A' },
};
const metaFor = (type) => TYPE_META[type] || { label: 'แจ้งเตือน', color: '#546E7A' };

// ── ป้ายหมวดหมู่ ─────────────────────────────────────────────────────────────
const CategoryBadge = ({ type }) => {
  const meta = metaFor(type);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: meta.color,
        color: '#fff',
        fontSize: '0.72rem',
        fontWeight: 500,
        lineHeight: 1.6,
      }}
    >
      {meta.label}
    </Box>
  );
};

// ── หนึ่งรายการแจ้งเตือน ──────────────────────────────────────────────────────
const NotificationRow = ({ notif, onOpen, onDismiss }) => {
  const ref = notif.complaint_number;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        px: { xs: 2, sm: 3 },
        py: 2.25,
        transition: 'background-color .15s',
        bgcolor: notif.is_read ? 'transparent' : (t) => alpha(t.palette.primary.main, 0.04),
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* ปุ่มปิด (ทำเครื่องหมายว่าอ่านแล้ว) */}
      <Tooltip title={notif.is_read ? 'อ่านแล้ว' : 'ทำเครื่องหมายว่าอ่านแล้ว'}>
        <span>
          <IconButton
            size="small"
            disabled={notif.is_read}
            onClick={(e) => { e.stopPropagation(); onDismiss(notif); }}
            sx={{
              mt: 0.25,
              bgcolor: 'grey.100',
              color: 'grey.500',
              borderRadius: 1.5,
              '&:hover': { bgcolor: 'grey.200', color: 'grey.700' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* เนื้อหา (คลิกเพื่อเปิดเรื่อง) */}
      <Box
        onClick={() => onOpen(notif)}
        sx={{ flexGrow: 1, minWidth: 0, cursor: notif.complaint_id ? 'pointer' : 'default' }}
      >
        <CategoryBadge type={notif.type} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.75 }}>
          {notif.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {notif.message}
        </Typography>
        {ref && (
          <Typography variant="body2" color="error" fontWeight={600} sx={{ mt: 0.75 }}>
            {ref}
          </Typography>
        )}
      </Box>

      {/* เวลา */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, color: 'text.disabled', mt: 0.5 }}>
        <AccessTimeIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" noWrap>{formatDateTime(notif.created_at)}</Typography>
      </Box>
    </Box>
  );
};

const NotificationPage = () => {
  const navigate = useNavigate();
  const { markAllRead: ctxMarkAllRead } = useNotification();

  const [tab, setTab]                 = useState(0); // 0=all, 1=unread
  const [rows, setRows]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const LIMIT = 20;

  const load = useCallback(async (pg = page, unreadOnly = tab === 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationApi.getList({ page: pg, limit: LIMIT, unread_only: unreadOnly });
      const d = res.data?.data || {};
      setRows(d.notifications || []);
      setTotal(d.pagination?.total || 0);
      setUnreadCount(d.unread_count ?? 0);
    } catch (err) {
      setError(extractError(err, 'ไม่สามารถโหลดการแจ้งเตือนได้ กรุณาลองใหม่'));
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    load(page, tab === 1);
  }, [page, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (_, v) => { setTab(v); setPage(1); };
  const handlePageChange = (_, v) => setPage(v);

  const markReadLocal = (id) => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (tab === 1) {
      // แท็บ "ยังไม่อ่าน" → เอาออกจากรายการ (dismiss)
      setRows((prev) => prev.filter((n) => n.id !== id));
    } else {
      setRows((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    }
  };

  const handleOpen = async (notif) => {
    if (!notif.is_read) {
      await notificationApi.markRead(notif.id).catch(() => {});
      markReadLocal(notif.id);
    }
    if (notif.complaint_id) navigate(`/complaints/${notif.complaint_id}`);
  };

  const handleDismiss = async (notif) => {
    if (notif.is_read) return;
    try {
      await notificationApi.markRead(notif.id);
      markReadLocal(notif.id);
    } catch (err) {
      toastError(err, 'ทำเครื่องหมายอ่านไม่สำเร็จ');
    }
  };

  const handleMarkAllRead = async () => {
    await ctxMarkAllRead();
    setUnreadCount(0);
    if (tab === 1) setRows([]);
    else setRows((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box>
      {/* Header + watermark */}
      <Box sx={{ position: 'relative', mb: 3, overflow: 'hidden' }}>
        <Typography
          aria-hidden
          sx={{
            position: 'absolute',
            top: -14,
            right: 0,
            fontSize: { xs: '2.75rem', sm: '4rem' },
            fontWeight: 700,
            letterSpacing: '-2px',
            color: 'text.primary',
            opacity: 0.05,
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Notifications
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 46, height: 46, borderRadius: 2.5, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'primary.main',
                bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                '& .MuiSvgIcon-root': { fontSize: 24 },
              }}
            >
              <NotificationsNoneIcon />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>การแจ้งเตือน</Typography>
              <Typography variant="body2" color="text.secondary">
                {unreadCount > 0 ? `มี ${unreadCount.toLocaleString('th-TH')} รายการที่ยังไม่ได้อ่าน` : 'อ่านครบทุกรายการแล้ว'}
              </Typography>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead} variant="outlined">
              ทำเครื่องหมายอ่านทั้งหมด
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter tabs */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="ทั้งหมด" />
        <Tab
          label="ยังไม่อ่าน"
          icon={unreadCount > 0 ? <Chip label={unreadCount} size="small" color="error" sx={{ height: 20 }} /> : undefined}
          iconPosition="end"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box py={8} textAlign="center"><CircularProgress /></Box>
        ) : error ? (
          <Box py={8} textAlign="center">
            <Typography color="error" mb={2}>{error}</Typography>
            <Button variant="outlined" onClick={() => load(page, tab === 1)}>ลองใหม่</Button>
          </Box>
        ) : rows.length === 0 ? (
          <Box py={8} textAlign="center">
            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              {tab === 1 ? 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน' : 'ยังไม่มีการแจ้งเตือน'}
            </Typography>
          </Box>
        ) : (
          rows.map((notif, idx) => (
            <Box key={notif.id}>
              {idx > 0 && <Divider />}
              <NotificationRow notif={notif} onOpen={handleOpen} onDismiss={handleDismiss} />
            </Box>
          ))
        )}
      </Paper>

      {totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default NotificationPage;
