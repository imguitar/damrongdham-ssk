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
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/citizen"
            sx={{ color: 'white', textDecoration: 'none', fontWeight: 700, flexGrow: 1 }}
          >
            ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ
          </Typography>

          {citizen ? (
            <>
              <Button
                component={RouterLink}
                to="/citizen/complaints"
                sx={{ color: 'white', mr: 1 }}
              >
                เรื่องของฉัน
              </Button>
              <Button
                component={RouterLink}
                to="/citizen/complaints/new"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', mr: 1 }}
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
              <Button component={RouterLink} to="/citizen/login" sx={{ color: 'white', mr: 1 }}>
                เข้าสู่ระบบ
              </Button>
              <Button
                component={RouterLink}
                to="/citizen/register"
                variant="outlined"
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
          ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ — ระบบรับเรื่องร้องเรียน DCMS
        </Typography>
        <Box mt={0.5}>
          <Link component={RouterLink} to="/public/complaints/new" variant="body2" sx={{ mr: 2 }}>
            ยื่นเรื่อง (ไม่ต้องสมัครสมาชิก)
          </Link>
          <Link component={RouterLink} to="/public/track" variant="body2">
            ติดตามสถานะ
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default CitizenLayout;
