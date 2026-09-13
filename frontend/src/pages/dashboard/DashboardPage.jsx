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
import { darken } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
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
const AGENCY_ROLES  = [ROLES.AGENCY_OFFICER, ROLES.AGENCY_HEAD];

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

const STATUS_HEX = {
  NEW: '#1565c0', SCREENING: '#7b1fa2', ASSIGNED: '#0277bd',
  ACCEPTED: '#00796b', IN_PROGRESS: '#f57c00', RESOLVED: '#558b2f',
  REVIEWING: '#6a1b9a', CLOSED: '#2e7d32', REJECTED: '#c62828', RETURNED: '#e65100',
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

const SummaryCard = ({ label, value, icon, accent, details = [], onClick, largeIcon = false }) => {
  const content = (
    <CardContent
      sx={{
        minHeight: largeIcon ? 136 : 132,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: largeIcon ? 2.25 : 2,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box minWidth={0}>
          <Typography
            variant={largeIcon ? 'subtitle1' : 'body2'}
            sx={{ color: 'rgba(255,255,255,0.92)', fontSize: largeIcon ? '1.05rem' : undefined }}
            fontWeight={largeIcon ? 600 : 500}
          >
            {label}
          </Typography>
          <Typography
            variant={largeIcon ? 'h3' : 'h4'}
            fontWeight={largeIcon ? 800 : 700}
            color="inherit"
            lineHeight={1.1}
            mt={largeIcon ? 0.75 : 0.5}
            sx={{ fontSize: largeIcon ? '2.5rem' : undefined }}
          >
            {value?.toLocaleString('th-TH') ?? '-'}
          </Typography>
        </Box>
        {!largeIcon && (
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.98)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
              '& .MuiSvgIcon-root': { fontSize: 40 },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {details.length > 0 && (
        <Box display="flex" alignItems="center" flexWrap="wrap" columnGap={0.75} rowGap={0.25} mt={1.25}>
          {details.map((detail, index) => (
            <Box key={detail.label} display="flex" alignItems="center" gap={0.35}>
              {index > 0 && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.48)' }}>•</Typography>}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>{detail.label}</Typography>
              <Typography variant="caption" color="inherit" fontWeight={600}>
                {Number(detail.value || 0).toLocaleString('th-TH')}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </CardContent>
  );

  return (
    <Card
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        color: '#fff',
        background: `linear-gradient(135deg, ${darken(accent, 0.36)} 0%, ${darken(accent, 0.08)} 100%)`,
        boxShadow: (theme) => theme.shadows[3],
        transition: (theme) => theme.transitions.create(['transform', 'box-shadow'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(onClick && {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) => theme.shadowsSoftHover,
          },
        }),
      }}
    >
      {largeIcon && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            right: -8,
            bottom: -16,
            opacity: 0.18,
            color: '#fff',
            pointerEvents: 'none',
            zIndex: 0,
            '& .MuiSvgIcon-root': { fontSize: 104 },
            transform: 'rotate(-8deg)',
          }}
        >
          {icon}
        </Box>
      )}
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%', color: 'inherit' }}>
          {content}
        </CardActionArea>
      ) : content}
    </Card>
  );
};

const CardSection = ({ title, subtitle, icon, cards, columns = 3, loading, onCardClick, largeIcon = false }) => (
  <Box mb={2.5}>
    <Box mb={1.25}>
      <Box display="flex" alignItems="center" gap={0.75}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      </Box>
      {subtitle && <Typography variant="caption" color="text.secondary" sx={{ ml: icon ? 3.75 : 0 }}>{subtitle}</Typography>}
    </Box>
    <Grid container spacing={2}>
      {cards.map((card) => {
        const { key, ...cardProps } = card;
        return (
          <Grid item xs={columns === 4 ? 6 : 12} sm={columns === 4 ? 6 : 4} md={12 / columns} key={key}>
            <SummaryCard
              {...cardProps}
              value={loading ? undefined : card.value}
              onClick={onCardClick ? () => onCardClick(card) : undefined}
              largeIcon={largeIcon}
            />
          </Grid>
        );
      })}
    </Grid>
  </Box>
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
        dashboardApi.getEscalated(params),
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

  const isAgency = AGENCY_ROLES.includes(role);
  const isExecutive = role === ROLES.EXECUTIVE;
  const pendingTotal = Math.max(0, (s.total || 0) - (s.closed || 0) - (s.rejected || 0));

  const overviewCards = [
    { key: 'total', label: 'ทั้งหมด', value: s.total || 0, accent: '#1565C0', icon: <AssignmentIcon />, filter: {} },
    {
      key: 'pending', label: 'คงค้าง', value: pendingTotal, accent: '#3949AB', icon: <PendingActionsIcon />,
      filter: { statuses: 'NEW,SCREENING,ASSIGNED,ACCEPTED,IN_PROGRESS,RESOLVED,REVIEWING,RETURNED' },
    },
    { key: 'closed', label: 'ปิดแล้ว', value: s.closed || 0, accent: '#2E7D32', icon: <CheckCircleIcon />, filter: { status: 'CLOSED' } },
    { key: 'rejected', label: 'ปฏิเสธ', value: s.rejected || 0, accent: '#64748B', icon: <CancelIcon />, filter: { status: 'REJECTED' } },
  ];

  const centerCards = [
    {
      key: 'center-queue', label: 'รอรับและคัดกรอง',
      value: (s.new || 0) + (s.screening || 0) + (s.returned || 0),
      accent: '#0288D1', icon: <NewReleasesIcon />,
      details: [
        { label: 'ใหม่', value: s.new },
        { label: 'คัดกรอง', value: s.screening },
        { label: 'ส่งกลับ', value: s.returned },
      ],
      filter: { statuses: 'NEW,SCREENING,RETURNED' },
    },
    {
      key: 'center-in-progress', label: 'ศูนย์กำลังดำเนินการ', value: s.center_in_progress || 0,
      accent: '#00838F', icon: <AccountBalanceIcon />, filter: { status: 'IN_PROGRESS', work_owner: 'center' },
    },
    {
      key: 'center-review', label: 'รอตรวจผลและปิดเรื่อง', value: (s.resolved || 0) + (s.reviewing || 0),
      accent: '#6A1B9A', icon: <FactCheckIcon />,
      details: [
        { label: 'รอตรวจ', value: s.resolved },
        { label: 'กำลังตรวจ', value: s.reviewing },
      ],
      filter: { statuses: 'RESOLVED,REVIEWING' },
    },
  ];

  const agencyCards = [
    { key: 'assigned', label: 'รอหน่วยงานรับเรื่อง', value: s.assigned || 0, accent: '#5E35B1', icon: <SendIcon />, filter: { status: 'ASSIGNED' } },
    { key: 'accepted', label: 'รับแล้ว รอเริ่มงาน', value: s.accepted || 0, accent: '#00796B', icon: <AssignmentTurnedInIcon />, filter: { status: 'ACCEPTED' } },
    {
      key: 'agency-progress', label: 'หน่วยงานกำลังดำเนินการ', value: s.agency_in_progress || 0,
      accent: '#B45309', icon: <BusinessIcon />, filter: { status: 'IN_PROGRESS', work_owner: 'agency' },
    },
  ];

  const urgentCards = [
    { key: 'near-due', label: 'ใกล้ครบกำหนด SLA', value: s.near_due || 0, accent: '#A16207', icon: <ScheduleIcon />, filter: { near_due: 'true' }, urgent: true },
    { key: 'overdue', label: 'เกินกำหนด SLA', value: s.overdue || 0, accent: '#D32F2F', icon: <WarningAmberIcon />, filter: { is_overdue: 'true' }, urgent: true },
    {
      key: 'escalated', label: 'เรื่องที่ถูกเร่งรัด', value: s.escalated || 0, accent: '#C2185B', icon: <ErrorOutlineIcon />, urgent: true,
      details: [
        { label: 'L1', value: s.escalation_l1 },
        { label: 'L2', value: s.escalation_l2 },
        { label: 'L3', value: s.escalation_l3 },
      ],
      filter: { escalated: 'true' },
    },
  ];

  const openCard = (card) => {
    if (isExecutive) return;
    const params = { ...card.filter };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    navigate('/complaints', { state: { dashboardFilter: { label: card.label, params } } });
  };

  // Trend chart data — add Thai month label
  const trendData = data.trend.map((t) => ({ ...t, monthLabel: MONTHS_TH[t.month - 1] }));

  // Category bar — top 8
  const catData = data.byCategory
    .filter((c) => Number(c.total) > 0)
    .slice(0, 8)
    .map((c) => ({ name: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name, ทั้งหมด: c.total, ปิด: c.closed, เกิน: c.overdue }));

  // Agency bar — top 8
  const agData = data.byAgency
    .filter((a) => Number(a.total) > 0)
    .slice(0, 8)
    .map((a) => ({ name: a.short_name || a.name.slice(0, 12), ทั้งหมด: a.total, ปิด: a.closed, เกิน: a.overdue }));

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
        <Box display="flex" alignItems="center" gap={1.25}>
          <DashboardIcon sx={{ fontSize: 32, color: '#1565C0' }} />
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 60%, #00838F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Dashboard
            </Typography>
          </Box>
        </Box>
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
            sx={{ height: 40 }}
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
      <CardSection
        icon={<AssignmentIcon sx={{ color: '#1565C0', fontSize: 22 }} />}
        title="ภาพรวม"
        subtitle="สรุปจำนวนเรื่องตามผลลัพธ์ล่าสุด"
        cards={overviewCards}
        columns={4}
        loading={loading}
        onCardClick={isExecutive ? null : openCard}
        largeIcon
      />

      {(isCenterAdmin || isExecutive) && (
        <CardSection
          icon={<AccountBalanceIcon sx={{ color: '#00838F', fontSize: 22 }} />}
          title="งานของศูนย์ดำรงธรรม"
          subtitle="คิวรับเรื่อง คัดกรอง และตรวจผลก่อนปิดเรื่อง"
          cards={centerCards}
          loading={loading}
          onCardClick={isExecutive ? null : openCard}
        />
      )}

      <CardSection
        icon={<BusinessIcon sx={{ color: '#B45309', fontSize: 22 }} />}
        title="งานของหน่วยงานปลายทาง"
        subtitle={isAgency ? 'คิวงานของหน่วยงานที่คุณสังกัด' : 'คิวรับเรื่องและดำเนินการของหน่วยงานที่รับส่งต่อ'}
        cards={agencyCards}
        loading={loading}
        onCardClick={isExecutive ? null : openCard}
      />

      <CardSection
        icon={<WarningAmberIcon sx={{ color: '#D32F2F', fontSize: 22 }} />}
        title="งานต้องติดตามเร่งด่วน"
        subtitle="แสดงทุกการ์ดแม้ยังไม่มีงาน เพื่อให้เห็นสถานะครบถ้วน"
        cards={urgentCards}
        loading={loading}
        onCardClick={isExecutive ? null : openCard}
      />

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

          {(catData.length > 0 || agData.length > 0) && (
            <Grid container spacing={2} mb={2}>
              {/* Category Bar */}
              {catData.length > 0 && (
                <Grid item xs={12} md={agData.length > 0 ? 6 : 12}>
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
              )}

              {/* Agency Bar */}
              {agData.length > 0 && (
                <Grid item xs={12} md={catData.length > 0 ? 6 : 12}>
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
              )}
            </Grid>
          )}
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
