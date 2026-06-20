import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Pagination from '@mui/material/Pagination';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import DoneAllIcon from '@mui/icons-material/DoneAll';

import * as notificationApi from '../../api/notificationApi';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDateShort } from '../../utils/formatters';

const TYPE_COLOR = {
  SLA_OVERDUE:    'error',
  SLA_NEAR_DUE:   'warning',
  ESCALATION_L1:  'error',
  ESCALATION_L2:  'error',
  ESCALATION_L3:  'error',
};

const getColor = (type) => TYPE_COLOR[type] || 'info';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { markAllRead: ctxMarkAllRead } = useNotification();

  const [tab, setTab]               = useState(0); // 0=all, 1=unread
  const [rows, setRows]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
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
    } catch {
      setError('ไม่สามารถโหลดการแจ้งเตือนได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    load(page, tab === 1);
  }, [page, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (_, v) => {
    setTab(v);
    setPage(1);
  };

  const handlePageChange = (_, v) => setPage(v);

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await notificationApi.markRead(notif.id).catch(() => {});
      setRows((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notif.complaint_id) navigate(`/complaints/${notif.complaint_id}`);
  };

  const handleMarkAllRead = async () => {
    await ctxMarkAllRead();
    setRows((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700}>การแจ้งเตือน</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} ยังไม่อ่าน`} color="error" size="small" />
          )}
        </Box>
        {unreadCount > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
            variant="outlined"
          >
            ทำเครื่องหมายอ่านทั้งหมด
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="ทั้งหมด" />
        <Tab label={`ยังไม่อ่าน${unreadCount > 0 ? ` (${unreadCount})` : ''}`} />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box py={6} textAlign="center"><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">ไม่มีการแจ้งเตือน</Typography>
        </Box>
      ) : (
        <>
          <List disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {rows.map((notif, idx) => (
              <Box key={notif.id}>
                {idx > 0 && <Divider />}
                <ListItemButton
                  onClick={() => handleClick(notif)}
                  sx={{
                    alignItems: 'flex-start',
                    bgcolor: notif.is_read ? 'transparent' : 'action.hover',
                    borderLeft: notif.is_read ? 'none' : '3px solid',
                    borderColor: `${getColor(notif.type)}.main`,
                    py: 1.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography
                          variant="body2"
                          fontWeight={notif.is_read ? 400 : 700}
                          sx={{ flex: 1 }}
                        >
                          {notif.title}
                        </Typography>
                        {!notif.is_read && (
                          <Box
                            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${getColor(notif.type)}.main`, flexShrink: 0 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatDateShort(notif.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </Box>
            ))}
          </List>

          {totalPages > 1 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default NotificationPage;
