import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';

import { useAuth } from '../../contexts/AuthContext';
import { DRAWER_WIDTH } from '../../utils/constants';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleProfile = () => {
    handleCloseMenu();
    navigate('/profile');
  };

  const handleChangePassword = () => {
    handleCloseMenu();
    navigate('/change-password');
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        {/* Notification — badge count wired in Phase 12 */}
        <Tooltip title="การแจ้งเตือน">
          <IconButton onClick={() => navigate('/notifications')} sx={{ mr: 0.5 }}>
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User avatar menu */}
        <Tooltip title={user?.full_name || user?.username || ''}>
          <IconButton onClick={handleOpenMenu} sx={{ p: 0.5 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.main',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
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
