import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Outlet } from 'react-router-dom';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AUTH_APPBAR_HEIGHT, AUTH_APPBAR_TITLE_FONT_SIZE } from '../../utils/constants';

const CitizenLayout = () => {
  const { citizen, logout } = useCitizenAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/citizen/login');
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" bgcolor="background.default">
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 1, minHeight: `${AUTH_APPBAR_HEIGHT}px !important`, height: AUTH_APPBAR_HEIGHT }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/citizen"
            sx={{ color: 'white', textDecoration: 'none', fontWeight: 700, flexGrow: 1, fontSize: AUTH_APPBAR_TITLE_FONT_SIZE }}
          >
            Sisaket E-Complaint Management System
          </Typography>

          {citizen ? (
            <>
              <Button
                component={RouterLink}
                to="/citizen/complaints"
                size="small"
                sx={{ color: 'white' }}
              >
                เรื่องของฉัน
              </Button>
              <Button
                component={RouterLink}
                to="/citizen/complaints/new"
                variant="outlined"
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              >
                ยื่นเรื่องใหม่
              </Button>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'white' }}>
                <AccountCircleIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem disabled sx={{ fontSize: 14, color: 'text.secondary' }}>
                  {citizen.full_name}
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => { setAnchorEl(null); navigate('/citizen/profile'); }}
                >
                  ข้อมูลส่วนตัว
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  ออกจากระบบ
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/citizen/login" size="small" sx={{ color: 'white' }}>
                เข้าสู่ระบบ
              </Button>
              <Button
                component={RouterLink}
                to="/citizen/register"
                variant="outlined"
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              >
                สมัครสมาชิก
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.100',
          py: 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Sisaket E-Complaint Management System
        </Typography>
      </Box>
    </Box>
  );
};

export default CitizenLayout;
