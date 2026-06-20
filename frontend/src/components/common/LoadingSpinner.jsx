import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const LoadingSpinner = ({ message = 'กำลังโหลด...', fullPage = false }) => {
  const content = (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <CircularProgress />
      {message && <Typography variant="body2" color="text.secondary">{message}</Typography>}
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        {content}
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" py={6}>
      {content}
    </Box>
  );
};

export default LoadingSpinner;
