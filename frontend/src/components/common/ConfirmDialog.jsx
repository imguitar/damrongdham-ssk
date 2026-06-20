import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'ยืนยันการดำเนินการ',
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  confirmColor = 'primary',
  loading = false,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        color={confirmColor}
        variant="contained"
        disabled={loading}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
