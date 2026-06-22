import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DownloadIcon from '@mui/icons-material/Download';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import * as agencyApi from '../../api/agencyApi';
import * as complaintApi from '../../api/complaintApi';
import * as reportApi from '../../api/reportApi';
import { formatDateShort } from '../../utils/formatters';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const PRIORITY_LABELS_TH = { LOW: 'ต่ำ', MEDIUM: 'ปานกลาง', HIGH: 'สูง', CRITICAL: 'วิกฤต' };
const STATUS_LABELS_TH = {
  NEW: 'รับเรื่องใหม่', SCREENING: 'กำลังคัดกรอง', ASSIGNED: 'ส่งต่อหน่วยงาน',
  ACCEPTED: 'รับเรื่องแล้ว', IN_PROGRESS: 'กำลังดำเนินการ', RESOLVED: 'แก้ไขแล้ว',
  REVIEWING: 'กำลังตรวจผล', CLOSED: 'ปิด', REJECTED: 'ปฏิเสธ', RETURNED: 'ส่งคืน',
};

const today = () => new Date().toISOString().slice(0, 10);
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" fontWeight={700} mb={1}>{children}</Typography>
);

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

// ── Shared filter bar (date + optional agency dropdown) ───────────────────────

const DateFilter = ({
  from, to, onFromChange, onToChange, onSearch, loading, mb = 2,
  agencies, agencyId, onAgencyChange,
}) => (
  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={mb}>
    {agencies?.length > 0 && (
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel>หน่วยงาน</InputLabel>
        <Select
          value={agencyId || ''}
          label="หน่วยงาน"
          onChange={(e) => onAgencyChange(e.target.value)}
        >
          <MenuItem value="">-- ทั้งหมด --</MenuItem>
          {agencies.map((a) => (
            <MenuItem key={a.id} value={String(a.id)}>{a.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )}
    <TextField
      type="date" label="ตั้งแต่" size="small"
      value={from} onChange={(e) => onFromChange(e.target.value)}
      InputLabelProps={{ shrink: true }} sx={{ width: 145 }}
    />
    <TextField
      type="date" label="ถึง" size="small"
      value={to} onChange={(e) => onToChange(e.target.value)}
      InputLabelProps={{ shrink: true }} sx={{ width: 145 }}
    />
    <Button
      variant="outlined" size="small"
      startIcon={loading ? <CircularProgress size={14} /> : <FilterAltIcon />}
      onClick={onSearch} disabled={loading}
      sx={{ height: 40 }}
    >
      กรอง
    </Button>
  </Box>
);

// ── Tab 1: Monthly ────────────────────────────────────────────────────────────

const MonthlyTab = ({ agencies }) => {
  const [from, setFrom]       = useState(firstOfYear());
  const [to, setTo]           = useState(today());
  const [agencyId, setAgency] = useState('');
  const [rows, setRows]       = useState([]);
  const [loading, setLoad]    = useState(false);
  const [error, setError]     = useState('');
  const [loaded, setLoaded]   = useState(false);

  const load = useCallback(async () => {
    setLoad(true); setError('');
    try {
      const params = { date_from: from, date_to: to };
      if (agencyId) params.agency_id = agencyId;
      const res = await reportApi.getMonthly(params);
      setRows(res.data?.data?.report || []);
      setLoaded(true);
    } catch { setError('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoad(false); }
  }, [from, to, agencyId]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = rows.map((r) => ({
    label: `${MONTHS_TH[(r.month || 1) - 1]} ${String(r.year).slice(-2)}`,
    รับเรื่อง: r.total,
    ปิดเรื่อง: r.closed,
    เกินกำหนด: r.overdue,
  }));

  return (
    <Box>
      <DateFilter
        from={from} to={to} onFromChange={setFrom} onToChange={setTo}
        onSearch={load} loading={loading}
        agencies={agencies} agencyId={agencyId} onAgencyChange={setAgency}
      />
      {error && <Typography color="error" variant="body2" mb={1}>{error}</Typography>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {loaded && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <SectionTitle>แนวโน้มรายเดือน</SectionTitle>
              {chartData.length === 0 ? (
                <Typography color="text.secondary" variant="body2" textAlign="center" py={3}>ไม่มีข้อมูล</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="รับเรื่อง" stroke="#1976d2" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ปิดเรื่อง" stroke="#2e7d32" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="เกินกำหนด" stroke="#d32f2f" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <SectionTitle>ตารางรายเดือน</SectionTitle>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>เดือน</TableCell>
                      <TableCell align="right">รับเรื่อง</TableCell>
                      <TableCell align="right">ปิดเรื่อง</TableCell>
                      <TableCell align="right">เกินกำหนด</TableCell>
                      <TableCell align="right">อัตราปิด (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                    ) : rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{MONTHS_TH[(r.month || 1) - 1]} {r.year + 543}</TableCell>
                        <TableCell align="right">{r.total?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">{r.closed?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">{r.overdue?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">
                          {r.total > 0 ? ((r.closed / r.total) * 100).toFixed(1) : '0.0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

// ── Tab 2: By Category ────────────────────────────────────────────────────────

const ByCategoryTab = ({ agencies }) => {
  const [from, setFrom]       = useState(firstOfYear());
  const [to, setTo]           = useState(today());
  const [agencyId, setAgency] = useState('');
  const [rows, setRows]       = useState([]);
  const [loading, setLoad]    = useState(false);
  const [error, setError]     = useState('');
  const [loaded, setLoaded]   = useState(false);

  const load = useCallback(async () => {
    setLoad(true); setError('');
    try {
      const params = { date_from: from, date_to: to };
      if (agencyId) params.agency_id = agencyId;
      const res = await reportApi.getByCategory(params);
      setRows(res.data?.data?.report || []);
      setLoaded(true);
    } catch { setError('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoad(false); }
  }, [from, to, agencyId]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = rows.slice(0, 10).map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 14) + '…' : r.name,
    ทั้งหมด: r.total,
    ปิด: r.closed,
    เกิน: r.overdue,
  }));

  return (
    <Box>
      <DateFilter
        from={from} to={to} onFromChange={setFrom} onToChange={setTo}
        onSearch={load} loading={loading}
        agencies={agencies} agencyId={agencyId} onAgencyChange={setAgency}
      />
      {error && <Typography color="error" variant="body2" mb={1}>{error}</Typography>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {loaded && (
        <>
          {rows.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <SectionTitle>ประเภทเรื่อง (สูงสุด 10)</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ทั้งหมด" fill="#1976d2" maxBarSize={14} />
                    <Bar dataKey="ปิด"     fill="#2e7d32" maxBarSize={14} />
                    <Bar dataKey="เกิน"    fill="#d32f2f" maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent>
              <SectionTitle>ตารางตามประเภทเรื่อง</SectionTitle>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ประเภทเรื่อง</TableCell>
                      <TableCell align="right">รับเรื่อง</TableCell>
                      <TableCell align="right">ปิดเรื่อง</TableCell>
                      <TableCell align="right">เกินกำหนด</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                    ) : rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell align="right">{r.total?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">{r.closed?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">{r.overdue?.toLocaleString('th-TH')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

// ── Tab 3: By Agency ──────────────────────────────────────────────────────────

const ByAgencyTab = ({ agencies }) => {
  const [from, setFrom]            = useState(firstOfYear());
  const [to, setTo]                = useState(today());
  const [selectedAgency, setSelAg] = useState('');
  const [rows, setRows]            = useState([]);
  const [loading, setLoad]         = useState(false);
  const [error, setError]          = useState('');
  const [loaded, setLoaded]        = useState(false);

  const [cRows, setCRows]   = useState([]);
  const [cPage, setCPage]   = useState(0);
  const [cTotal, setCTotal] = useState(0);
  const [cLimit]            = useState(25);

  const loadAggregate = useCallback(async () => {
    setLoad(true); setError('');
    try {
      const res = await reportApi.getByAgency({ date_from: from, date_to: to });
      setRows(res.data?.data?.report || []);
      setLoaded(true);
    } catch { setError('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoad(false); }
  }, [from, to]);

  const loadComplaints = useCallback(async (pg = 0) => {
    setLoad(true); setError('');
    try {
      const params = { date_from: from, date_to: to, page: pg + 1, limit: cLimit, agency_id: selectedAgency };
      const res = await complaintApi.list(params);
      setCRows(res.data?.data || []);
      setCTotal(res.data?.pagination?.total || 0);
      setCPage(pg);
      setLoaded(true);
    } catch { setError('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoad(false); }
  }, [from, to, selectedAgency, cLimit]);

  const load = useCallback(() => {
    if (selectedAgency) loadComplaints(0);
    else loadAggregate();
  }, [selectedAgency, loadComplaints, loadAggregate]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when agency selection changes (skip initial mount)
  const agencyChangedRef = useRef(false);
  useEffect(() => {
    if (!agencyChangedRef.current) { agencyChangedRef.current = true; return; }
    setLoaded(false); setCRows([]); setRows([]);
    load();
  }, [selectedAgency]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = rows.slice(0, 10).map((r) => ({
    name: (r.short_name || r.name || '').slice(0, 12),
    ทั้งหมด: r.total,
    ปิด: r.closed,
    เกิน: r.overdue,
  }));

  const agencyLabel = agencies.find((a) => String(a.id) === String(selectedAgency))?.name || '';

  return (
    <Box>
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={2}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>หน่วยงาน</InputLabel>
          <Select value={selectedAgency} label="หน่วยงาน" onChange={(e) => setSelAg(e.target.value)}>
            <MenuItem value="">-- ทั้งหมด (ภาพรวม) --</MenuItem>
            {agencies.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>{a.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <DateFilter
          from={from} to={to} onFromChange={setFrom} onToChange={setTo}
          onSearch={load} loading={loading} mb={0}
        />
      </Box>

      {error && <Typography color="error" variant="body2" mb={1}>{error}</Typography>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {loaded && !selectedAgency && (
        <>
          {rows.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <SectionTitle>หน่วยงาน (สูงสุด 10)</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ทั้งหมด" fill="#0097a7" maxBarSize={14} />
                    <Bar dataKey="ปิด"     fill="#2e7d32" maxBarSize={14} />
                    <Bar dataKey="เกิน"    fill="#d32f2f" maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent>
              <SectionTitle>ตารางตามหน่วยงาน</SectionTitle>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>หน่วยงาน</TableCell>
                      <TableCell align="right">รับเรื่อง</TableCell>
                      <TableCell align="right">ปิดเรื่อง</TableCell>
                      <TableCell align="right">เกินกำหนด</TableCell>
                      <TableCell align="right">อัตราปิด (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                    ) : rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell align="right">{r.total?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">{r.closed?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">{r.overdue?.toLocaleString('th-TH')}</TableCell>
                        <TableCell align="right">
                          {r.total > 0 ? ((r.closed / r.total) * 100).toFixed(1) : '0.0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {loaded && selectedAgency && (
        <Card>
          <CardContent>
            <SectionTitle>
              รายการเรื่องร้องเรียน — {agencyLabel} ({cTotal.toLocaleString('th-TH')} รายการ)
            </SectionTitle>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>เลขที่</TableCell>
                    <TableCell>หัวเรื่อง</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>ความสำคัญ</TableCell>
                    <TableCell align="right">วันที่รับเรื่อง</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cRows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                  ) : cRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Typography variant="body2" color="primary.main">{r.complaint_number}</Typography>
                      </TableCell>
                      <TableCell>{(r.title || '').slice(0, 50)}</TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABELS_TH[r.status] || r.status}
                          size="small"
                          color={r.status === 'CLOSED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={PRIORITY_LABELS_TH[r.priority] || r.priority}
                          size="small"
                          color={r.priority === 'CRITICAL' ? 'error' : r.priority === 'HIGH' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatDateShort(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={cTotal}
              page={cPage}
              rowsPerPage={cLimit}
              rowsPerPageOptions={[25]}
              onPageChange={(_, p) => loadComplaints(p)}
              labelDisplayedRows={({ from: f, to: t, count }) => `${f}–${t} จาก ${count}`}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// ── Tab 4: Overdue ────────────────────────────────────────────────────────────

const OverdueTab = ({ agencies }) => {
  const [from, setFrom]       = useState(firstOfYear());
  const [to, setTo]           = useState(today());
  const [agencyId, setAgency] = useState('');
  const [rows, setRows]       = useState([]);
  const [loading, setLoad]    = useState(false);
  const [error, setError]     = useState('');
  const [loaded, setLoaded]   = useState(false);
  const [page, setPage]       = useState(0);
  const [total, setTotal]     = useState(0);
  const [limit]               = useState(25);

  const load = useCallback(async (pg = 0) => {
    setLoad(true); setError('');
    try {
      const params = { date_from: from, date_to: to, page: pg + 1, limit };
      if (agencyId) params.agency_id = agencyId;
      const res = await reportApi.getOverdue(params);
      setRows(res.data?.data?.report || []);
      setTotal(res.data?.data?.pagination?.total || 0);
      setPage(pg);
      setLoaded(true);
    } catch { setError('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoad(false); }
  }, [from, to, agencyId, limit]);

  useEffect(() => { load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <DateFilter
        from={from} to={to} onFromChange={setFrom} onToChange={setTo}
        onSearch={() => load(0)} loading={loading}
        agencies={agencies} agencyId={agencyId} onAgencyChange={setAgency}
      />
      {error && <Typography color="error" variant="body2" mb={1}>{error}</Typography>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {loaded && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <SectionTitle>เรื่องเกินกำหนด ({total.toLocaleString('th-TH')} รายการ)</SectionTitle>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>เลขที่</TableCell>
                    <TableCell>หัวเรื่อง</TableCell>
                    <TableCell>หน่วยงาน</TableCell>
                    <TableCell>ความสำคัญ</TableCell>
                    <TableCell align="right">ครบกำหนด</TableCell>
                    <TableCell align="right">เกิน (วัน)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">ไม่มีข้อมูล</TableCell></TableRow>
                  ) : rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><Typography variant="body2" color="primary.main">{r.complaint_number}</Typography></TableCell>
                      <TableCell>{r.title?.slice(0, 40)}</TableCell>
                      <TableCell>{r.agency_short_name || r.agency_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={PRIORITY_LABELS_TH[r.priority] || r.priority}
                          size="small"
                          color={r.priority === 'CRITICAL' ? 'error' : r.priority === 'HIGH' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatDateShort(r.due_date)}</TableCell>
                      <TableCell align="right">
                        <Chip label={`${r.days_overdue} วัน`} color="error" size="small" />
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
      )}
    </Box>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const ReportPage = () => {
  const [tab, setTab]             = useState(0);
  const [agencies, setAgencies]   = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    agencyApi.list({ limit: 200 }).then((r) => {
      const all = r.data?.data?.agencies || [];
      const center = all.filter((a) => a.is_center);
      const others = all.filter((a) => !a.is_center);
      setAgencies([...center, ...others]);
    }).catch(() => {});
  }, []);

  const exportTypeMap = ['monthly', 'by-category', 'by-agency', 'overdue'];
  const tabLabels     = ['รายเดือน', 'ตามประเภทเรื่อง', 'ตามหน่วยงาน', 'เรื่องเกินกำหนด'];

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportApi.exportExcel({ type: exportTypeMap[tab] });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${exportTypeMap[tab]}_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setExporting(false);
    }
  };

  const TAB_CONTENT = [
    <MonthlyTab    agencies={agencies} />,
    <ByCategoryTab agencies={agencies} />,
    <ByAgencyTab   agencies={agencies} />,
    <OverdueTab    agencies={agencies} />,
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>รายงาน</Typography>
        <Button
          variant="outlined" size="small"
          startIcon={exporting ? <CircularProgress size={14} /> : <DownloadIcon />}
          onClick={handleExport} disabled={exporting}
        >
          Export Excel
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          variant="scrollable" scrollButtons="auto"
        >
          {tabLabels.map((l, i) => <Tab key={i} label={l} />)}
        </Tabs>
      </Paper>

      {TAB_CONTENT[tab]}
    </Box>
  );
};

export default ReportPage;
