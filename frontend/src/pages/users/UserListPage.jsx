import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorAlert from '../../components/common/ErrorAlert';
import * as userApi from '../../api/userApi';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const EMPTY_FILTERS = { search: '', role: '' };

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }));

const UserListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toggleTarget, setToggleTarget] = useState(null);

  const load = useCallback((page = 1, applied = activeFilters) => {
    setLoading(true);
    const params = {
      page, limit: pagination.limit,
      ...(applied.search ? { search: applied.search } : {}),
      ...(applied.role ? { role: applied.role } : {}),
    };
    userApi.list(params)
      .then((res) => {
        setUsers(res.data?.data || []);
        setPagination((p) => ({ ...p, ...res.data?.pagination, page }));
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [activeFilters, pagination.limit]); // eslint-disable-line

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try {
      await userApi.toggleStatus(toggleTarget.id);
      setToggleTarget(null);
      load(pagination.page, activeFilters);
    } catch {
      setError('เกิดข้อผิดพลาด');
    }
  };

  const columns = [
    { key: 'username', label: 'Username', width: 140 },
    { key: 'full_name', label: 'ชื่อ-นามสกุล' },
    { key: 'email', label: 'อีเมล', width: 200 },
    {
      key: 'role_code',
      label: 'บทบาท',
      width: 160,
      render: (row) => <Chip label={ROLE_LABELS[row.role_code] || row.role_code} size="small" variant="outlined" />,
    },
    { key: 'agency_name', label: 'หน่วยงาน', width: 200, render: (row) => row.agency_name || '-' },
    {
      key: 'is_active',
      label: 'สถานะ',
      width: 90,
      render: (row) => (
        <Chip
          label={row.is_active ? 'ใช้งาน' : 'ปิดใช้'}
          color={row.is_active ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    { key: 'last_login_at', label: 'Login ล่าสุด', width: 150, render: (row) => formatDateTime(row.last_login_at) },
    {
      key: 'actions',
      label: '',
      width: 90,
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="แก้ไข">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/users/${row.id}/edit`); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}>
            <IconButton
              size="small"
              color={row.is_active ? 'error' : 'success'}
              onClick={(e) => { e.stopPropagation(); setToggleTarget(row); }}
            >
              {row.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>จัดการผู้ใช้งาน</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/users/new')}>
          เพิ่มผู้ใช้
        </Button>
      </Box>

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onSearch={() => { setActiveFilters(filters); load(1, filters); }}
        onClear={() => { setFilters(EMPTY_FILTERS); setActiveFilters(EMPTY_FILTERS); load(1, EMPTY_FILTERS); }}
        fields={[
          { key: 'search', label: 'ค้นหา (ชื่อ/Username)', type: 'text' },
          { key: 'role', label: 'บทบาท', type: 'select', options: ROLE_OPTIONS },
        ]}
      />

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        total={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        onPageChange={(p) => load(p + 1)}
        onRowsPerPageChange={(rpp) => { setPagination((p) => ({ ...p, limit: rpp })); load(1); }}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.is_active ? 'ปิดใช้งานผู้ใช้' : 'เปิดใช้งานผู้ใช้'}
        message={`ต้องการ${toggleTarget?.is_active ? 'ปิด' : 'เปิด'}ใช้งาน "${toggleTarget?.username}" ใช่หรือไม่?`}
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </Box>
  );
};

export default UserListPage;
