import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import { extractError } from '../../utils/alert';

// รองรับทั้ง prop `error` (error object) และ `message` (string ที่เตรียมไว้แล้ว)
const ErrorAlert = ({ error, message: messageProp, title = 'เกิดข้อผิดพลาด', onRetry, sx }) => {
  const message = messageProp || extractError(error);

  return (
    <Box py={2} sx={sx}>
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
