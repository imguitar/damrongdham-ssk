import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import GroupsIcon from '@mui/icons-material/Groups';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import ErrorAlert from '../../components/common/ErrorAlert';
import PageHeader from '../../components/common/PageHeader';
import CitizenMemberDialog from '../../components/citizen/CitizenMemberDialog';
import * as citizenAdminApi from '../../api/citizenAdminApi';
import { formatDateTime } from '../../utils/formatters';
import { extractError } from '../../utils/alert';

const EMPTY_FILTERS = { search: '', is_active: '', login_type: '' };

const STATUS_OPTIONS = [
  { value: 'true', label: 'ใช้งาน' },
  { value: 'false', label: 'ระงับ' },
];
const LOGIN_TYPE_OPTIONS = [
  { value: 'email', label: 'อีเมล/รหัสผ่าน' },
  { value: 'line', label: 'ผูกบัญชี LINE' },
  { value: 'provisional', label: 'ยังกรอกข้อมูลไม่ครบ' },
];

// แสดงเลขบัตรบางส่วนในตาราง — ดูเต็มได้ในหน้ารายละเอียด
const maskIdCard = (v) => (v && v.length === 13 ? `${v.slice(0, 1)}-XXXX-XXXXX-${v.slice(10, 12)}-${v.slice(12)}` : v || '-');

const CitizenMemberListPage = () => {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback((page = 1, applied = activeFilters, limit = pagination.limit) => {
    setLoading(true);
    setError('');
    const params = {
      page, limit,
      ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)),
    };
    citizenAdminApi.list(params)
      .then((res) => {
        setRows(res.data?.data || []);
        setPagination((p) => ({ ...p, ...res.data?.pagination, page, limit }));
      })
      .catch((err) => setError(extractError(err, 'โหลดรายชื่อสมาชิกไม่สำเร็จ')))
      .finally(() => setLoading(false));
  }, [activeFilters, pagination.limit]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    {
      key: 'full_name',
      label: 'ชื่อ-นามสกุล',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{row.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email || 'ไม่มีอีเมล'}</Typography>
        </Box>
      ),
    },
    { key: 'phone', label: 'เบอร์โทรศัพท์', width: 130, render: (row) => row.phone || '-' },
    { key: 'id_card', label: 'เลขบัตรประชาชน', width: 170, render: (row) => maskIdCard(row.id_card) },
    {
      key: 'login',
      label: 'เข้าสู่ระบบด้วย',
      width: 150,
      render: (row) => (
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {!!row.has_password && <Chip size="small" label="อีเมล" variant="outlined" />}
          {!!row.line_linked && <Chip size="small" label="LINE" sx={{ bgcolor: '#06C755', color: '#fff' }} />}
          {!!row.is_provisional && <Chip size="small" label="ไม่ครบ" color="warning" variant="outlined" />}
        </Box>
      ),
    },
    { key: 'complaint_count', label: 'เรื่อง', width: 70, render: (row) => row.complaint_count },
    {
      key: 'is_active',
      label: 'สถานะ',
      width: 90,
      render: (row) => (
        <Chip size="small" label={row.is_active ? 'ใช้งาน' : 'ระงับ'} color={row.is_active ? 'success' : 'default'} />
      ),
    },
    { key: 'last_login_at', label: 'เข้าใช้ล่าสุด', width: 150, render: (row) => (row.last_login_at ? formatDateTime(row.last_login_at) : '-') },
    { key: 'created_at', label: 'สมัครเมื่อ', width: 150, render: (row) => formatDateTime(row.created_at) },
  ];

  return (
    <Box>
      <PageHeader
        icon={<GroupsIcon />}
        title="จัดการสมาชิกประชาชน"
        subtitle="บัญชีประชาชนที่สมัครผ่านเว็บไซต์หรือ LINE (แยกจากผู้ใช้งานเจ้าหน้าที่)"
      />

      {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onSearch={() => { setActiveFilters(filters); load(1, filters); }}
        onClear={() => { setFilters(EMPTY_FILTERS); setActiveFilters(EMPTY_FILTERS); load(1, EMPTY_FILTERS); }}
        fields={[
          { key: 'search', label: 'ค้นหา (ชื่อ/อีเมล/เบอร์โทร/เลขบัตร)', type: 'text' },
          { key: 'is_active', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
          { key: 'login_type', label: 'ประเภทบัญชี', type: 'select', options: LOGIN_TYPE_OPTIONS },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        total={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        onPageChange={(p) => load(p + 1)}
        onRowsPerPageChange={(rpp) => load(1, activeFilters, rpp)}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <CitizenMemberDialog
        key={selectedId || 'closed'}
        citizenId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => load(pagination.page, activeFilters)}
      />
    </Box>
  );
};

export default CitizenMemberListPage;
