import Chip from '@mui/material/Chip';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';

const StatusChip = ({ status, size = 'small', ...props }) => {
  const label = STATUS_LABELS[status] || status || '-';
  const color = STATUS_COLORS[status] || 'default';
  return <Chip label={label} color={color} size={size} {...props} />;
};

export default StatusChip;
