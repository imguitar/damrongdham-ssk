import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ADMIN_HEADER_HEIGHT, DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../../utils/constants';
import agency1Icon from '../icons/Agency-1.png';
import agency2Icon from '../icons/Agency-2.png';

const TYPE_COLOR = {
  SLA_OVERDUE:    'error',
  SLA_NEAR_DUE:   'warning',
  ESCALATION_L1:  'error',
  ESCALATION_L2:  'error',
  ESCALATION_L3:  'error',
};

const getTypeColor = (type) => TYPE_COLOR[type] || 'info';

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'เมื่อกี้';
  if (diff < 3600)  return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
};

const Topbar = ({ drawerOpen, onDesktopDrawerToggle, onMobileMenuClick }) => {
  const { user, logout }                        = useAuth();
  const { unreadCount, notifications, markRead, markAllRead, fetchNotifications } = useNotification();
  const navigate                                = useNavigate();
  const [anchorEl, setAnchorEl]                = useState(null);
  const [notifAnchor, setNotifAnchor]           = useState(null);

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleOpenNotif = (e) => {
    setNotifAnchor(e.currentTarget);
    fetchNotifications({ limit: 10 });
  };
  const handleCloseNotif = () => setNotifAnchor(null);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    handleCloseNotif();
    if (notif.complaint_id) navigate(`/complaints/${notif.complaint_id}`);
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleProfile = () => { handleCloseMenu(); navigate('/profile'); };
  const handleChangePassword = () => { handleCloseMenu(); navigate('/change-password'); };
  const handleLogout = () => { handleCloseMenu(); logout(); navigate('/login'); };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  const notifOpen = Boolean(notifAnchor);

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{
        width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)` },
        ml: { md: `${drawerOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px` },
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${ADMIN_HEADER_HEIGHT}px !important`,
          height: ADMIN_HEADER_HEIGHT,
        }}
      >
        <IconButton edge="start" onClick={onMobileMenuClick} sx={{ mr: 1, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <IconButton edge="start" onClick={onDesktopDrawerToggle} sx={{ mr: 1, display: { xs: 'none', md: 'inline-flex' } }}>
          <MenuIcon />
        </IconButton>

        <Box component="img" src={agency1Icon} alt="agency-1" sx={{ height: 36, width: 'auto', mr: 1 }} />
        <Box component="img" src={agency2Icon} alt="agency-2" sx={{ height: 36, width: 'auto' }} />

        <Box sx={{ flex: 1 }} />

        {/* Notification Bell */}
        <Tooltip title="การแจ้งเตือน">
          <IconButton onClick={handleOpenNotif} sx={{ mr: 0.5 }}>
            <Badge badgeContent={unreadCount || null} color="error" max={99}>
              {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notification Popover */}
        <Popover
          open={notifOpen}
          anchorEl={notifAnchor}
          onClose={handleCloseNotif}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { width: 360, maxHeight: 480, display: 'flex', flexDirection: 'column' } }}
        >
          {/* Header */}
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              การแจ้งเตือน {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
            </Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.72rem' }}>
                อ่านทั้งหมด
              </Button>
            )}
          </Box>

          {/* List */}
          <List dense disablePadding sx={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <Box py={4} textAlign="center">
                <Typography variant="body2" color="text.secondary">ไม่มีการแจ้งเตือน</Typography>
              </Box>
            ) : (
              notifications.map((notif) => (
                <ListItemButton
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  sx={{
                    alignItems: 'flex-start',
                    bgcolor: notif.is_read ? 'transparent' : 'action.hover',
                    borderLeft: notif.is_read ? 'none' : `3px solid`,
                    borderColor: `${getTypeColor(notif.type)}.main`,
                    px: 2,
                    py: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={notif.is_read ? 400 : 600} noWrap>
                        {notif.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block">
                          {timeAgo(notif.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              ))
            )}
          </List>

          {/* Footer */}
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button
              size="small"
              fullWidth
              onClick={() => { handleCloseNotif(); navigate('/notifications'); }}
            >
              ดูการแจ้งเตือนทั้งหมด
            </Button>
          </Box>
        </Popover>

        {/* User avatar menu */}
        <Tooltip title={user?.full_name || user?.username || ''}>
          <IconButton onClick={handleOpenMenu} sx={{ p: 0.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 0.5, minWidth: 180 } }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.full_name || user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role_label || user?.role}
            </Typography>
          </Box>
          <MenuItem onClick={handleProfile}>โปรไฟล์ของฉัน</MenuItem>
          <MenuItem onClick={handleChangePassword}>เปลี่ยนรหัสผ่าน</MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            ออกจากระบบ
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
