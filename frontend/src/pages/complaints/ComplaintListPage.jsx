import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import ErrorAlert from '../../components/common/ErrorAlert';
import * as complaintApi from '../../api/complaintApi';
import * as masterDataApi from '../../api/masterDataApi';
import { useAuth } from '../../contexts/AuthContext';
import { COMPLAINT_STATUS, STATUS_LABELS, PRIORITY_LABELS, ROLES } from '../../utils/constants';
import { formatDate, truncate } from '../../utils/formatters';

const WRITE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER];

const FILTER_FIELDS = [
  { key: 'search', label: 'ค้นหา (หัวเรื่อง/เลขที่)', type: 'text' },
  {
    key: 'status',
    label: 'สถานะ',
    type: 'select',
    options: Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
  {
    key: 'priority',
    label: 'ความสำคัญ',
    type: 'select',
    options: Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
];

const EMPTY_FILTERS = { search: '', status: '', priority: '', category_id: '' };

const ComplaintListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Load categories for filter
  useEffect(() => {
    masterDataApi.listCategories()
      .then((res) => setCategories(res?.data?.data?.categories || []))
      .catch(() => {});
  }, []);

  const filterFields = [
    ...FILTER_FIELDS,
    {
      key: 'category_id',
      label: 'ประเภทเรื่อง',
      type: 'select',
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
  ];

  const load = useCallback((page = 1, applied = activeFilters) => {
    setLoading(true);
    setError(null);
    const params = {
      page,
      limit: pagination.limit,
      ...(applied.search ? { search: applied.search } : {}),
      ...(applied.status ? { status: applied.status } : {}),
      ...(applied.priority ? { priority: applied.priority } : {}),
      ...(applied.category_id ? { category_id: applied.category_id } : {}),
    };
    complaintApi.list(params)
      .then((res) => {
        setComplaints(res.data?.data || []);
        setPagination((p) => ({ ...p, ...res.data?.pagination, page }));
      })
      .catch((err) => setError(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setLoading(false));
  }, [activeFilters, pagination.limit]); // eslint-disable-line

  useEffect(() => { load(1); }, []); // eslint-disable-line

  const handleSearch = () => {
    setActiveFilters(filters);
    load(1, filters);
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    load(1, EMPTY_FILTERS);
  };

  const columns = [
    { key: 'complaint_number', label: 'เลขที่', width: 150 },
    {
      key: 'title',
      label: 'หัวเรื่อง',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          {row.is_overdue ? (
            <Tooltip title="เกินกำหนด">
              <WarningAmberIcon fontSize="small" color="error" />
            </Tooltip>
          ) : null}
          <Typography variant="body2">{truncate(row.title, 50)}</Typography>
        </Box>
      ),
    },
    { key: 'channel_name', label: 'ช่องทาง', width: 130 },
    {
      key: 'status',
      label: 'สถานะ',
      width: 140,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      key: 'priority',
      label: 'ความสำคัญ',
      width: 110,
      render: (row) => <PriorityChip priority={row.priority} />,
    },
    { key: 'due_date', label: 'กำหนดแล้วเสร็จ', width: 140, render: (row) => formatDate(row.due_date) },
    { key: 'created_at', label: 'วันที่รับเรื่อง', width: 130, render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      label: '',
      width: 60,
      render: (row) => (
        <IconButton size="small" onClick={() => navigate(`/complaints/${row.id}`)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const canCreate = WRITE_ROLES.includes(user?.role);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>เรื่องร้องเรียน</Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/complaints/new')}
          >
            รับเรื่องใหม่
          </Button>
        )}
      </Box>

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onClear={handleClear}
        fields={filterFields}
      />

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
        onRowClick={(row) => navigate(`/complaints/${row.id}`)}
      />
    </Box>
  );
};

export default ComplaintListPage;
