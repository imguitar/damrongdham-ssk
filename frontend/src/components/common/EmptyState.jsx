import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';

const EmptyState = ({ title = 'ไม่มีข้อมูล', description, action, icon: Icon = InboxIcon }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    py={8}
    gap={1.5}
  >
    <Icon sx={{ fontSize: 56, color: 'text.disabled' }} />
    <Typography variant="h6" color="text.secondary" fontWeight={500}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={320}>
        {description}
      </Typography>
    )}
    {action && <Box mt={1}>{action}</Box>}
  </Box>
);

export default EmptyState;
