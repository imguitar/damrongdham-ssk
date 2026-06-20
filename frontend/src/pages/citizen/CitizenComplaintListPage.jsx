import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ErrorAlert from '../../components/common/ErrorAlert';
import * as citizenApi from '../../api/citizenApi';
import { formatDate, truncate } from '../../utils/formatters';

const CitizenComplaintListPage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback((page = 1) => {
    setLoading(true);
    citizenApi.listMyComplaints({ page, limit: pagination.limit })
      .then((res) => {
        // API returns data as array directly
        setComplaints(Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.complaints || []);
        setPagination((p) => ({ ...p, ...res.data?.pagination, page }));
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [pagination.limit]); // eslint-disable-line

  useEffect(() => { load(); }, []); // eslint-disable-line

  const columns = [
    { key: 'complaint_number', label: 'เลขที่', width: 160 },
    { key: 'title', label: 'หัวเรื่อง', render: (row) => truncate(row.title, 50) },
    { key: 'category_name', label: 'ประเภท', width: 160 },
    { key: 'status', label: 'สถานะ', width: 150, render: (row) => <StatusChip status={row.status} /> },
    {
      key: 'is_anonymous',
      label: '',
      width: 80,
      render: (row) => row.is_anonymous ? <Chip label="ปกปิด" size="small" color="warning" variant="outlined" /> : null,
    },
    { key: 'created_at', label: 'วันที่ยื่น', width: 130, render: (row) => formatDate(row.created_at) },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>เรื่องร้องเรียนของฉัน</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/citizen/complaints/new')}
        >
          ยื่นเรื่องใหม่
        </Button>
      </Box>

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      <DataTable
        columns={columns}
        rows={complaints}
        loading={loading}
        total={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        onPageChange={(p) => load(p + 1)}
        onRowsPerPageChange={(rpp) => {
          setPagination((p) => ({ ...p, limit: rpp }));
          load(1);
        }}
        onRowClick={(row) => navigate(`/citizen/complaints/${row.complaint_number}`)}
        emptyText="ยังไม่มีเรื่องร้องเรียน"
      />
    </Box>
  );
};

export default CitizenComplaintListPage;
