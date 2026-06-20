import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';

const ErrorAlert = ({ error, title = 'เกิดข้อผิดพลาด', onRetry }) => {
  const message =
    error?.response?.data?.error?.message ||
    error?.message ||
    'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง';

  return (
    <Box py={2}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Box
              component="span"
              sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
              onClick={onRetry}
            >
              ลองใหม่
            </Box>
          ) : undefined
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;
