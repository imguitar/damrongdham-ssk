import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { DRAWER_WIDTH } from '../../utils/constants';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NotificationProvider } from '../../contexts/NotificationContext';

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NotificationProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Topbar onMenuClick={() => setMobileOpen((prev) => !prev)} />
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          <Toolbar /> {/* offset for fixed AppBar */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </NotificationProvider>
  );
};

export default AdminLayout;
