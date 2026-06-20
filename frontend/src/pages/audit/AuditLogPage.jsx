import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import axiosInstance from '../../api/axiosInstance';
import { formatDateTime } from '../../utils/formatters';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_COLORS = {
  CREATE: 'success', UPDATE: 'info', DELETE: 'error',
  LOGIN: 'primary', LOGOUT: 'default', EXPORT: 'warning',
};

const EMPTY = { action: '', resource: '', date_from: '', date_to: '' };

// ── Main Component ────────────────────────────────────────────────────────────

const AuditLogPage = () => {
  const [filters, setFilters]     = useState(EMPTY);
  const [applied, setApplied]     = useState(EMPTY);
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [page, setPage]           = useState(0);
  const [total, setTotal]         = useState(0);
  const [limit]                   = useState(25);

  const load = useCallback(async (pg = 0, f = applied) => {
    setLoading(true); setError('');
    try {
      const params = { page: pg + 1, limit };
      if (f.action)    params.action    = f.action;
      if (f.resource)  params.resource  = f.resource;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to)   params.date_to   = f.date_to;

      const res = await axiosInstance.get('/audit-logs', { params });
      setRows(res.data?.data?.logs || []);
      setTotal(res.data?.data?.pagination?.total || 0);
      setPage(pg);
    } catch { setError('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoading(false); }
  }, [applied, limit]);

  useEffect(() => { load(0); }, []); // eslint-disable-line

  const handleSearch = () => {
    setApplied(filters);
    load(0, filters);
  };

  const handleClear = () => {
    setFilters(EMPTY);
    setApplied(EMPTY);
    load(0, EMPTY);
  };

  const setField = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Audit Log</Typography>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <TextField
              label="Action" size="small" value={filters.action}
              onChange={setField('action')} placeholder="เช่น CREATE, LOGIN"
              sx={{ width: 160 }}
            />
            <TextField
              label="Resource" size="small" value={filters.resource}
              onChange={setField('resource')} placeholder="เช่น complaints"
              sx={{ width: 160 }}
            />
            <TextField
              type="date" label="ตั้งแต่" size="small"
              value={filters.date_from} onChange={setField('date_from')}
              InputLabelProps={{ shrink: true }} sx={{ width: 145 }}
            />
            <TextField
              type="date" label="ถึง" size="small"
              value={filters.date_to} onChange={setField('date_to')}
              InputLabelProps={{ shrink: true }} sx={{ width: 145 }}
            />
            <Button
              variant="contained" size="small" startIcon={<FilterAltIcon />}
              onClick={handleSearch} disabled={loading}
            >
              กรอง
            </Button>
            <Button
              variant="outlined" size="small" startIcon={<FilterAltOffIcon />}
              onClick={handleClear} disabled={loading}
            >
              ล้าง
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading && <LinearProgress />}
          {error && (
            <Typography color="error" variant="body2" sx={{ p: 2 }}>{error}</Typography>
          )}
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell width={60}>ID</TableCell>
                  <TableCell width={170}>วันที่/เวลา</TableCell>
                  <TableCell>ผู้ใช้</TableCell>
                  <TableCell width={110}>Action</TableCell>
                  <TableCell width={130}>Resource</TableCell>
                  <TableCell width={90}>Resource ID</TableCell>
                  <TableCell width={130}>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary" variant="body2">ไม่พบข้อมูล</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {formatDateTime(row.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.full_name || row.username || '-'}</Typography>
                      {row.username && row.full_name && (
                        <Typography variant="caption" color="text.secondary">@{row.username}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.action}
                        size="small"
                        color={ACTION_COLORS[row.action?.toUpperCase()] || 'default'}
                        sx={{ fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{row.resource || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{row.resource_id || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                        {row.ip_address || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[25]}
            onPageChange={(_, p) => load(p)}
            labelDisplayedRows={({ from: f, to: t, count }) => `${f}–${t} จาก ${count}`}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditLogPage;
