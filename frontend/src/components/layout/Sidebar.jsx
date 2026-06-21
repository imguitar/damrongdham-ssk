import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';

import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_HEADER_HEIGHT, MINI_DRAWER_WIDTH, ROLES, DRAWER_WIDTH } from '../../utils/constants';
import appIcon from '../icons/App-Icon-v2.png';

const { SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER, EXECUTIVE } = ROLES;

const ALL_STAFF = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, AGENCY_HEAD, AGENCY_OFFICER, EXECUTIVE];
const CENTER_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF];
const REPORT_ROLES = [SUPER_ADMIN, ADMIN, OFFICER, CHIEF, EXECUTIVE];
const ADMIN_ROLES = [SUPER_ADMIN, ADMIN];

const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ALL_STAFF,
  },
  {
    id: 'complaints',
    label: 'เรื่องร้องเรียน',
    icon: <AssignmentIcon />,
    path: '/complaints',
    roles: ALL_STAFF,
  },
  {
    id: 'reports',
    label: 'รายงาน',
    icon: <BarChartIcon />,
    path: '/reports',
    roles: REPORT_ROLES,
  },
  {
    id: 'notifications',
    label: 'แจ้งเตือน',
    icon: <NotificationsIcon />,
    path: '/notifications',
    roles: CENTER_ROLES,
  },
];

const ADMIN_MENU_ITEMS = [
  {
    id: 'users',
    label: 'ผู้ใช้งาน',
    icon: <PeopleIcon />,
    path: '/users',
    roles: ADMIN_ROLES,
  },
  {
    id: 'agencies',
    label: 'หน่วยงาน',
    icon: <BusinessIcon />,
    path: '/agencies',
    roles: ADMIN_ROLES,
  },
  {
    id: 'settings',
    label: 'ตั้งค่า Master Data',
    icon: <SettingsIcon />,
    path: '/settings',
    roles: ADMIN_ROLES,
  },
  {
    id: 'audit-logs',
    label: 'Audit Log',
    icon: <HistoryIcon />,
    path: '/audit-logs',
    roles: ADMIN_ROLES,
  },
];

const MenuItem = ({ item, selected, open }) => {
  const navigate = useNavigate();
  const button = (
    <ListItemButton
      selected={selected}
      onClick={() => navigate(item.path)}
      sx={{
        mx: 1,
        px: open ? 1.5 : 1,
        minHeight: 44,
        justifyContent: open ? 'flex-start' : 'center',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          justifyContent: 'center',
          mr: open ? 1.5 : 0,
        }}
      >
        {item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
        sx={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
      />
    </ListItemButton>
  );

  if (open) return button;

  return (
    <Tooltip title={item.label} placement="right">
      {button}
    </Tooltip>
  );
};

const SidebarContent = ({ open }) => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role || '';
  const visibleMain = MENU_ITEMS.filter((m) => m.roles.includes(role));
  const visibleAdmin = ADMIN_MENU_ITEMS.filter((m) => m.roles.includes(role));

  const isSelected = (path) =>
    path === '/dashboard'
      ? location.pathname === path
      : location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo / Header */}
      <Box
        sx={{
          px: open ? 2 : 1,
          py: 0,
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
          color: '#fff',
          minHeight: ADMIN_HEADER_HEIGHT,
          height: ADMIN_HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          borderRadius: 0,
        }}
      >
        {open ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'rgba(255,255,255,0.16)',
                color: '#fff',
                borderRadius: 2,
              }}
            >
              <Box
                component="img"
                src={appIcon}
                alt="App icon"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                Sisaket E-CMS
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                จังหวัดศรีสะเกษ
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 28,
                height: 28,
                bgcolor: 'rgba(255,255,255,0.16)',
                color: '#fff',
                borderRadius: 1.5,
              }}
            >
              <Box
                component="img"
                src={appIcon}
                alt="App icon"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Avatar>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List dense disablePadding>
          {visibleMain.map((item) => (
            <MenuItem key={item.id} item={item} selected={isSelected(item.path)} open={open} />
          ))}
        </List>

        {visibleAdmin.length > 0 && (
          <>
            <Divider sx={{ my: 1, mx: 2 }} />
            {open && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ px: 3, pb: 0.5, display: 'block', fontWeight: 600, letterSpacing: 0.5 }}
              >
                จัดการระบบ
              </Typography>
            )}
            <List dense disablePadding>
              {visibleAdmin.map((item) => (
                <MenuItem key={item.id} item={item} selected={isSelected(item.path)} open={open} />
              ))}
            </List>
          </>
        )}
      </Box>
    </Box>
  );
};

const Sidebar = ({ drawerOpen, mobileOpen, onMobileClose }) => (
  <Box component="nav" sx={{ width: { md: drawerOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
    {/* Mobile drawer */}
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRadius: 0 },
      }}
    >
      <SidebarContent open />
    </Drawer>

    {/* Desktop drawer */}
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: drawerOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        '& .MuiDrawer-paper': {
          width: drawerOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
      open
    >
      <SidebarContent open={drawerOpen} />
    </Drawer>
  </Box>
);

export default Sidebar;
