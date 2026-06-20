import Chip from '@mui/material/Chip';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';

const PriorityChip = ({ priority, size = 'small', ...props }) => {
  const label = PRIORITY_LABELS[priority] || priority || '-';
  const color = PRIORITY_COLORS[priority] || 'default';
  return <Chip label={label} color={color} size={size} variant="outlined" {...props} />;
};

export default PriorityChip;
