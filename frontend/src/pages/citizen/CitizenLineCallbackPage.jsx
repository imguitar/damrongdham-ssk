import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';

// Receives the citizen JWT from the LINE Login callback via URL fragment
// (#token=...&provisional=0|1). The fragment is never sent to the server or logged.
const CitizenLineCallbackPage = () => {
  const { loginWithToken } = useCitizenAuth();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React StrictMode double-invoke
    ran.current = true;

    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const token = params.get('token');

    if (!token) {
      navigate('/citizen/login?line_error=line_callback_failed', { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => {
        // strip token from the URL so it isn't kept in history
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/citizen/complaints', { replace: true });
      })
      .catch(() => {
        navigate('/citizen/login?line_error=line_callback_failed', { replace: true });
      });
  }, [loginWithToken, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        กำลังเข้าสู่ระบบด้วย LINE...
      </Typography>
    </Box>
  );
};

export default CitizenLineCallbackPage;
