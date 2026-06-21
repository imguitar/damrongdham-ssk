import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { ADMIN_HEADER_HEIGHT, DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../../utils/constants';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NotificationProvider } from '../../contexts/NotificationContext';

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <NotificationProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Topbar
          drawerOpen={drawerOpen}
          onDesktopDrawerToggle={() => setDrawerOpen((prev) => !prev)}
          onMobileMenuClick={() => setMobileOpen((prev) => !prev)}
        />
        <Sidebar
          drawerOpen={drawerOpen}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)` },
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          <Box sx={{ height: ADMIN_HEADER_HEIGHT }} /> {/* offset for fixed AppBar */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </NotificationProvider>
  );
};

export default AdminLayout;
