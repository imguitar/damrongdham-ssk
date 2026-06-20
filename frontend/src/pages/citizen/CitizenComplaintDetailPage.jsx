import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip';
import * as citizenApi from '../../api/citizenApi';
import { formatDate, formatDateTime } from '../../utils/formatters';

const InfoRow = ({ label, value }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2">{value || '-'}</Typography>
  </Box>
);

const PUBLIC_STATUS_LABELS = {
  NEW: 'รอดำเนินการ', SCREENING: 'กำลังคัดกรอง',
  ASSIGNED: 'ส่งต่อหน่วยงานแล้ว', ACCEPTED: 'หน่วยงานรับเรื่องแล้ว',
  IN_PROGRESS: 'อยู่ระหว่างดำเนินการ', RESOLVED: 'ดำเนินการเสร็จแล้ว',
  REVIEWING: 'อยู่ระหว่างตรวจผล', CLOSED: 'ปิดเรื่องแล้ว',
  REJECTED: 'ไม่รับเรื่อง', RETURNED: 'ส่งกลับแก้ไข',
};

const CitizenComplaintDetailPage = () => {
  const { complaint_number } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    citizenApi.getMyComplaint(complaint_number)
      .then((res) => setComplaint(res.data?.data?.complaint || res.data?.data))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [complaint_number]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!complaint) return null;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate('/citizen/complaints')}>
          กลับ
        </Button>
        <Typography variant="h6" fontWeight={700}>{complaint.complaint_number}</Typography>
        <StatusChip status={complaint.status} />
        {complaint.is_anonymous && <Chip label="ปกปิดตัวตน" size="small" color="warning" variant="outlined" />}
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={1}>{complaint.title}</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            สถานะ: <strong>{PUBLIC_STATUS_LABELS[complaint.status]}</strong>
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <InfoRow label="วันที่ยื่นเรื่อง" value={formatDateTime(complaint.created_at)} />
          <InfoRow label="กำหนดแล้วเสร็จ" value={complaint.due_date ? formatDate(complaint.due_date) : 'ยังไม่กำหนด'} />
          <InfoRow label="ประเภทเรื่อง" value={complaint.category_name} />
          <InfoRow label="ช่องทาง" value={complaint.channel_name} />

          {complaint.status === 'CLOSED' && complaint.closed_summary && (
            <Box mt={2} p={1.5} bgcolor="success.50" borderRadius={1} border="1px solid" borderColor="success.light">
              <Typography variant="caption" color="success.dark" fontWeight={600} display="block">ผลการดำเนินการ</Typography>
              <Typography variant="body2">{complaint.closed_summary}</Typography>
            </Box>
          )}
          {complaint.status === 'REJECTED' && complaint.rejection_reason && (
            <Box mt={2} p={1.5} bgcolor="error.50" borderRadius={1} border="1px solid" borderColor="error.light">
              <Typography variant="caption" color="error.dark" fontWeight={600} display="block">เหตุผลที่ไม่รับเรื่อง</Typography>
              <Typography variant="body2">{complaint.rejection_reason}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CitizenComplaintDetailPage;
