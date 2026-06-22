import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import * as dashboardApi from '../../api/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, STATUS_LABELS } from '../../utils/constants';
import { formatDateShort } from '../../utils/formatters';

// ── Constants ─────────────────────────────────────────────────────────────────

const REPORT_ROLES  = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER, ROLES.CHIEF, ROLES.EXECUTIVE];
const CENTER_ADMIN  = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER, ROLES.CHIEF];

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

const STATUS_HEX = {
  NEW: '#1565c0', SCREENING: '#7b1fa2', ASSIGNED: '#0277bd',
  ACCEPTED: '#00796b', IN_PROGRESS: '#f57c00', RESOLVED: '#558b2f',
  REVIEWING: '#6a1b9a', CLOSED: '#2e7d32', REJECTED: '#c62828', RETURNED: '#e65100',
};

const SUMMARY_GRADIENTS = {
  primary:   'linear-gradient(135deg, #0D47A1 0%, #1565C0 55%, #1976D2 100%)',
  info:      'linear-gradient(135deg, #01579B 0%, #0277BD 55%, #039BE5 100%)',
  warning:   'linear-gradient(135deg, #7A3E00 0%, #E65100 55%, #F57C00 100%)',
  error:     'linear-gradient(135deg, #7F1D1D 0%, #B71C1C 55%, #C62828 100%)',
  secondary: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 55%, #43A047 100%)',
  success:   'linear-gradient(135deg, #0B3D2E 0%, #1B5E20 55%, #2E7D32 100%)',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: 1.5 }}>
      {label !== undefined && (
        <Typography variant="caption" display="block" mb={0.5} fontWeight={600}>{label}</Typography>
      )}
      {payload.map((p, i) => (
        <Typography key={i} variant="body2" sx={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString('th-TH')}
        </Typography>
      ))}
    </Paper>
  );
};

const ChartCard = ({ title, children, action }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {action}
      </Box>
      {children}
    </CardContent>
  </Card>
);

const SummaryCard = ({ label, value, icon, color, onClick }) => (
  <Card
    sx={{
      height: '100%',
      color: '#fff',
      background: SUMMARY_GRADIENTS[color] || SUMMARY_GRADIENTS.primary,
      overflow: 'hidden',
    }}
  >
    <CardActionArea
      onClick={onClick}
      sx={{
        height: '100%',
        color: 'inherit',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)' }} noWrap>{label}</Typography>
            <Typography variant="h4" fontWeight={700} color="inherit" lineHeight={1.2} mt={0.5}>
              {value?.toLocaleString('th-TH') ?? '-'}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& .MuiSvgIcon-root': { fontSize: 28 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
);

// ── Main Component ────────────────────────────────────────────────────────────

const ESCALATION_CONFIG = {
  1: { label: 'L1', color: 'warning', bg: '#fff8e1', border: '#f9a825' },
  2: { label: 'L2', color: 'error',   bg: '#fce4ec', border: '#c62828' },
  3: { label: 'L3', color: 'error',   bg: '#4a0000', border: '#b71c1c' },
};

const EMPTY_DATA = {
  summary: {}, byStatus: [], byCategory: [], byAgency: [], trend: [], overdue: [], nearDue: [], escalated: [],
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || '';

  const isReportRole = REPORT_ROLES.includes(role);
  const isCenterAdmin = CENTER_ADMIN.includes(role);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [year, setYear]         = useState(CURRENT_YEAR);
  const [data, setData]         = useState(EMPTY_DATA);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;

      const calls = [
        dashboardApi.getSummary(params),
        dashboardApi.getByStatus(params),
        isReportRole ? dashboardApi.getByCategory(params) : Promise.resolve(null),
        isReportRole ? dashboardApi.getByAgency(params)   : Promise.resolve(null),
        isReportRole ? dashboardApi.getTrend({ year })     : Promise.resolve(null),
        isCenterAdmin ? dashboardApi.getOverdue(params)   : Promise.resolve(null),
        isCenterAdmin ? dashboardApi.getNearDue(params)   : Promise.resolve(null),
        dashboardApi.getEscalated(),
      ];

      const [sumRes, statusRes, catRes, agRes, trendRes, overdueRes, nearRes, escalRes] = await Promise.all(calls);

      setData({
        summary:    sumRes?.data?.data?.summary      || {},
        byStatus:   statusRes?.data?.data?.by_status || [],
        byCategory: catRes?.data?.data?.by_category  || [],
        byAgency:   agRes?.data?.data?.by_agency     || [],
        trend:      trendRes?.data?.data?.trend       || [],
        overdue:    overdueRes?.data?.data?.overdue   || [],
        nearDue:    nearRes?.data?.data?.near_due     || [],
        escalated:  escalRes?.data?.data?.escalated   || [],
      });
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, year, isReportRole, isCenterAdmin]);

  useEffect(() => { load(); }, [load]);

  const s = data.summary;

  // Summary card definitions
  const CARDS = [
    { key: 'total',      label: 'ทั้งหมด',          value: s.total,                               color: 'primary',   icon: <AssignmentIcon />,    nav: '/complaints' },
    { key: 'new',        label: 'รับใหม่/คัดกรอง',  value: (s.new||0)+(s.screening||0),           color: 'info',      icon: <NewReleasesIcon />,   nav: '/complaints', navState: { status: 'NEW' } },
    { key: 'active',     label: 'กำลังดำเนินการ',   value: (s.accepted||0)+(s.in_progress||0),    color: 'warning',   icon: <HourglassEmptyIcon />,nav: '/complaints', navState: { status: 'IN_PROGRESS' } },
    { key: 'overdue',    label: 'เกินกำหนด',         value: s.overdue,                             color: 'error',     icon: <WarningAmberIcon />,  nav: '/complaints' },
    { key: 'assigned',   label: 'ส่งต่อหน่วยงาน',   value: s.assigned,                            color: 'secondary', icon: <SendIcon />,          nav: '/complaints', navState: { status: 'ASSIGNED' } },
    { key: 'closed',     label: 'ปิดแล้ว',           value: s.closed,                              color: 'success',   icon: <CheckCircleIcon />,   nav: '/complaints', navState: { status: 'CLOSED' } },
  ];

  // Trend chart data — add Thai month label
  const trendData = data.trend.map((t) => ({ ...t, monthLabel: MONTHS_TH[t.month - 1] }));

  // Category bar — top 8
  const catData = data.byCategory.slice(0, 8).map((c) => ({ name: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name, ทั้งหมด: c.total, ปิด: c.closed, เกิน: c.overdue }));

  // Agency bar — top 8
  const agData = data.byAgency.slice(0, 8).map((a) => ({ name: a.short_name || a.name.slice(0, 12), ทั้งหมด: a.total, ปิด: a.closed, เกิน: a.overdue }));

  // Status pie
  const pieData = data.byStatus.filter((b) => b.count > 0).map((b) => ({
    name: STATUS_LABELS[b.status] || b.status,
    value: b.count,
    color: STATUS_HEX[b.status] || '#9e9e9e',
  }));

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box display="flex" flexWrap="wrap" gap={1} justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <TextField
            type="date" label="ตั้งแต่" size="small"
            value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 145 }}
          />
          <TextField
            type="date" label="ถึง" size="small"
            value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 145 }}
          />
          <Button
            variant="outlined" size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
            onClick={load} disabled={loading}
          >
            โหลดใหม่
          </Button>
        </Box>
      </Box>

      {error && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.light' }}>
          <Typography color="error" variant="body2">{error}</Typography>
        </Paper>
      )}

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {CARDS.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.key}>
            <SummaryCard
              label={card.label}
              value={loading ? undefined : card.value}
              icon={card.icon}
              color={card.color}
              onClick={() => navigate(card.nav, card.navState ? { state: card.navState } : undefined)}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Charts — REPORT_ROLES only ─────────────────────────── */}
      {isReportRole && (
        <>
          <Grid container spacing={2} mb={2}>
            {/* Trend Chart */}
            <Grid item xs={12} md={8}>
              <ChartCard
                title="แนวโน้มรายเดือน"
                action={
                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <InputLabel>ปี</InputLabel>
                    <Select value={year} label="ปี" onChange={(e) => setYear(Number(e.target.value))}>
                      {YEAR_OPTIONS.map((y) => <MenuItem key={y} value={y}>{y + 543}</MenuItem>)}
                    </Select>
                  </FormControl>
                }
              >
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="total" name="รับเรื่อง" stroke="#1976d2" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="closed" name="ปิดเรื่อง" stroke="#2e7d32" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            {/* Status Pie */}
            <Grid item xs={12} md={4}>
              <ChartCard title="สัดส่วนตามสถานะ">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={85}
                      dataKey="value" nameKey="name"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString('th-TH')} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={2}>
            {/* Category Bar */}
            <Grid item xs={12} md={6}>
              <ChartCard title="ตามประเภทเรื่อง (สูงสุด 8)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ทั้งหมด" fill="#1976d2" maxBarSize={14} />
                    <Bar dataKey="ปิด"     fill="#2e7d32" maxBarSize={14} />
                    <Bar dataKey="เกิน"    fill="#d32f2f" maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            {/* Agency Bar */}
            <Grid item xs={12} md={6}>
              <ChartCard title="ตามหน่วยงาน (สูงสุด 8)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={agData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ทั้งหมด" fill="#0097a7" maxBarSize={14} />
                    <Bar dataKey="ปิด"     fill="#2e7d32" maxBarSize={14} />
                    <Bar dataKey="เกิน"    fill="#d32f2f" maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}

      {/* ── Escalation Table — all staff ──────────────────────── */}
      {data.escalated.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ErrorOutlineIcon color="error" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700} color="error.main">
                เรื่องที่ถูกเร่งรัด ({data.escalated.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ระดับ</TableCell>
                      <TableCell>เลขที่</TableCell>
                      <TableCell>หัวเรื่อง</TableCell>
                      <TableCell>หน่วยงาน</TableCell>
                      <TableCell>ความสำคัญ</TableCell>
                      <TableCell align="right">ไม่มีอัปเดต (วัน)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.escalated.map((row) => {
                      const cfg = ESCALATION_CONFIG[row.escalation_level] || ESCALATION_CONFIG[1];
                      return (
                        <TableRow
                          key={row.id} hover sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/complaints/${row.id}`)}
                        >
                          <TableCell>
                            <Chip
                              label={cfg.label}
                              size="small"
                              color={cfg.color}
                              variant={row.escalation_level === 3 ? 'filled' : 'outlined'}
                              sx={row.escalation_level === 3 ? { color: '#fff', bgcolor: cfg.border } : {}}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                              {row.complaint_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.title?.slice(0, 40)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.agency_short_name || row.agency_name || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={{ LOW: 'ต่ำ', MEDIUM: 'ปานกลาง', HIGH: 'สูง', CRITICAL: 'วิกฤต' }[row.priority] || row.priority}
                              size="small"
                              color={row.priority === 'CRITICAL' ? 'error' : row.priority === 'HIGH' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {row.last_progress_at ? (() => {
                              const days = Math.floor((Date.now() - new Date(row.last_progress_at)) / 86400000);
                              return (
                                <Chip
                                  label={`${days} วัน`}
                                  size="small"
                                  color={days >= 90 ? 'error' : days >= 60 ? 'error' : 'warning'}
                                  variant={days >= 60 ? 'filled' : 'outlined'}
                                />
                              );
                            })() : <Typography variant="caption" color="text.secondary">-</Typography>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Overdue & Near-due Tables — CENTER_ADMIN only ─────── */}
      {isCenterAdmin && (
        <Grid container spacing={2}>
          {/* Overdue Table */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <WarningAmberIcon color="error" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700} color="error.main">
                    เรื่องเกินกำหนด SLA ({data.overdue.length})
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                {loading ? (
                  <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
                ) : data.overdue.length === 0 ? (
                  <Typography color="text.secondary" variant="body2" textAlign="center" py={2}>ไม่มีเรื่องเกินกำหนด</Typography>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>เลขที่</TableCell>
                          <TableCell>หน่วยงาน</TableCell>
                          <TableCell>ครบกำหนด</TableCell>
                          <TableCell align="right">เกิน (วัน)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.overdue.slice(0, 10).map((row) => (
                          <TableRow
                            key={row.id} hover sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/complaints/${row.id}`)}
                          >
                            <TableCell>
                              <Typography variant="body2" color="primary.main">{row.complaint_number}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{row.title?.slice(0, 30)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{row.agency_short_name || row.agency_name || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{formatDateShort(row.due_date)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={`${row.days_overdue} วัน`} color="error" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Near-due Table */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <HourglassEmptyIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700} color="warning.dark">
                    เรื่องใกล้ครบกำหนด SLA ({data.nearDue.length})
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                {loading ? (
                  <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
                ) : data.nearDue.length === 0 ? (
                  <Typography color="text.secondary" variant="body2" textAlign="center" py={2}>ไม่มีเรื่องใกล้ครบกำหนด</Typography>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>เลขที่</TableCell>
                          <TableCell>หน่วยงาน</TableCell>
                          <TableCell>ครบกำหนด</TableCell>
                          <TableCell align="right">เหลือ (วัน)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.nearDue.slice(0, 10).map((row) => (
                          <TableRow
                            key={row.id} hover sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/complaints/${row.id}`)}
                          >
                            <TableCell>
                              <Typography variant="body2" color="primary.main">{row.complaint_number}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{row.title?.slice(0, 30)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{row.agency_short_name || row.agency_name || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{formatDateShort(row.due_date)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${row.days_remaining} วัน`}
                                color={row.days_remaining <= 1 ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;
