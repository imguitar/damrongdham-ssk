import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ErrorAlert from '../../components/common/ErrorAlert';
import * as publicApi from '../../api/publicApi';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const PUBLIC_STATUS_LABELS = {
  NEW: 'รอดำเนินการ',
  SCREENING: 'กำลังคัดกรอง',
  ASSIGNED: 'ส่งต่อหน่วยงานแล้ว',
  ACCEPTED: 'หน่วยงานรับเรื่องแล้ว',
  IN_PROGRESS: 'อยู่ระหว่างดำเนินการ',
  RESOLVED: 'ดำเนินการเสร็จแล้ว',
  REVIEWING: 'อยู่ระหว่างตรวจผล',
  CLOSED: 'ปิดเรื่องแล้ว',
  REJECTED: 'ไม่รับเรื่อง',
  RETURNED: 'ส่งกลับแก้ไข',
};

const InfoRow = ({ label, value }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2">{value || '-'}</Typography>
  </Box>
);

const PublicTrackPage = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    const code = trackingCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await publicApi.trackComplaint(code);
      // API returns { data: { complaint: {...} } }
      setResult(res.data?.data?.complaint || res.data?.data);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'ไม่พบเรื่องร้องเรียนนี้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={640} mx="auto">
      <Button
        component={RouterLink}
        to="/citizen"
        variant="outlined"
        size="small"
        startIcon={<HomeIcon />}
        sx={{ mb: 2 }}
      >
        กลับหน้าหลัก
      </Button>

      <Box textAlign="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>ติดตามสถานะเรื่องร้องเรียน</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          กรอกรหัสติดตาม 4 ตัวอักษรที่ได้รับหลังยื่นเรื่อง
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              label="รหัสติดตาม (เช่น K7P3)"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              disabled={loading}
              size="small"
              inputProps={{ autoCapitalize: 'characters', style: { letterSpacing: 4, fontWeight: 600 } }}
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
              onClick={handleTrack}
              disabled={loading || trackingCode.length !== 4}
              sx={{ whiteSpace: 'nowrap', px: 3 }}
            >
              ค้นหา
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      {result && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>รหัส {result.tracking_code}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {result.title}
                </Typography>
              </Box>
              <Chip
                label={PUBLIC_STATUS_LABELS[result.status] || STATUS_LABELS[result.status]}
                color={STATUS_COLORS[result.status] || 'default'}
                size="small"
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <InfoRow label="วันที่ยื่นเรื่อง" value={formatDate(result.created_at)} />
            <InfoRow label="กำหนดแล้วเสร็จ" value={result.due_date ? formatDate(result.due_date) : 'ยังไม่กำหนด'} />
            {result.category_name && <InfoRow label="ประเภทเรื่อง" value={result.category_name} />}

            {result.status === 'CLOSED' && result.closed_summary && (
              <Box
                mt={2}
                p={1.5}
                bgcolor="success.50"
                borderRadius={1}
                border="1px solid"
                borderColor="success.light"
              >
                <Typography variant="caption" color="success.dark" fontWeight={600} display="block">
                  ผลการดำเนินการ
                </Typography>
                <Typography variant="body2">{result.closed_summary}</Typography>
              </Box>
            )}
            {result.status === 'REJECTED' && result.rejection_reason && (
              <Box
                mt={2}
                p={1.5}
                bgcolor="error.50"
                borderRadius={1}
                border="1px solid"
                borderColor="error.light"
              >
                <Typography variant="caption" color="error.dark" fontWeight={600} display="block">
                  เหตุผลที่ไม่รับเรื่อง
                </Typography>
                <Typography variant="body2">{result.rejection_reason}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PublicTrackPage;
