import { Outlet } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const PublicLayout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Sisaket E-Complaint Management System
        </Typography>
      </Toolbar>
    </AppBar>

    <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Outlet />
      </Container>
    </Box>

    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        © {new Date().getFullYear()} Sisaket E-Complaint Management System
      </Typography>
    </Box>
  </Box>
);

export default PublicLayout;
