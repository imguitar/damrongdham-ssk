import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { STATUS_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const EVENT_ICONS = {
  status_change: <SwapHorizIcon fontSize="small" />,
  update: <EditNoteIcon fontSize="small" />,
  assignment: <CheckCircleIcon fontSize="small" />,
};

const StatusTransition = ({ from_status, to_status }) => (
  <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
    {from_status && (
      <>
        <Chip label={STATUS_LABELS[from_status] || from_status} size="small" />
        <Typography variant="caption">→</Typography>
      </>
    )}
    <Chip
      label={STATUS_LABELS[to_status] || to_status}
      size="small"
      color="primary"
      variant="outlined"
    />
  </Box>
);

const ComplaintTimeline = ({ events = [] }) => {
  if (!events.length) {
    return (
      <Typography variant="body2" color="text.secondary" py={2}>
        ยังไม่มีประวัติ
      </Typography>
    );
  }

  return (
    <Box>
      {events.map((ev, idx) => (
        <Box key={ev.id || idx} display="flex" gap={2} mb={2}>
          {/* Left: icon + line */}
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.lighter' || 'primary.50',
                border: '2px solid',
                borderColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              {EVENT_ICONS[ev.event_type] || <SwapHorizIcon fontSize="small" />}
            </Box>
            {idx < events.length - 1 && (
              <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
            )}
          </Box>

          {/* Right: content */}
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, mb: idx < events.length - 1 ? 0 : 0 }}>
            {ev.event_type === 'status_change' && (
              <StatusTransition from_status={ev.from_status} to_status={ev.to_status} />
            )}
            {ev.event_type === 'update' && (
              <Typography variant="body2">{ev.content}</Typography>
            )}
            {ev.note && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                หมายเหตุ: {ev.note}
              </Typography>
            )}
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="caption" color="text.secondary">
                {ev.actor_name || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(ev.created_at)}
              </Typography>
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default ComplaintTimeline;
