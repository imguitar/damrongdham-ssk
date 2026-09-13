import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import * as dashboardApi from '../../api/dashboardApi';
import * as reportApi from '../../api/reportApi';

const MONTHS_FULL_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const today = () => new Date().toISOString().slice(0, 10);
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;
const number = (value) => Number(value || 0).toLocaleString('th-TH');
const percent = (value, total) => total > 0 ? ((Number(value || 0) / total) * 100).toFixed(1) : '0.0';
const longDate = (value) => {
  if (!value) return 'ไม่ระบุวันที่';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
};

const buildNarrative = ({ summary, categories, agencyRows, monthlyRows, period, agencyName }) => {
  const total = Number(summary.total || 0);
  const closed = Number(summary.closed || 0);
  const rejected = Number(summary.rejected || 0);
  const pending = Math.max(0, total - closed - rejected);
  const overdue = Number(summary.overdue || 0);
  const nearDue = Number(summary.near_due || 0);
  const escalated = Number(summary.escalated || 0);
  const topCategories = categories.filter((row) => Number(row.total) > 0).slice(0, 3);
  const topAgencies = agencyRows.filter((row) => Number(row.total) > 0).slice(0, 3);
  const peakMonth = monthlyRows.reduce(
    (peak, row) => (!peak || Number(row.total) > Number(peak.total) ? row : peak),
    null
  );

  const overview = total === 0
    ? `จากข้อมูลในระบบช่วงวันที่ ${period} ไม่พบเรื่องร้องเรียนตามเงื่อนไขที่เลือก จึงยังไม่มีฐานข้อมูลเพียงพอสำหรับจัดทำข้อสรุปเชิงปริมาณ`
    : `ในช่วงวันที่ ${period}${agencyName ? ` ${agencyName}` : ' ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ'}มีเรื่องร้องเรียนตามเงื่อนไขรวม ${number(total)} เรื่อง ดำเนินการปิดเรื่องแล้ว ${number(closed)} เรื่อง คิดเป็นร้อยละ ${percent(closed, total)} อยู่ระหว่างดำเนินการหรือคงค้าง ${number(pending)} เรื่อง คิดเป็นร้อยละ ${percent(pending, total)} และปฏิเสธ ${number(rejected)} เรื่อง คิดเป็นร้อยละ ${percent(rejected, total)}`;

  const categoryText = topCategories.length
    ? `เมื่อพิจารณาเฉพาะเรื่องที่ระบุประเภท พบประเภทเรื่องที่มีจำนวนสูงสุดตามลำดับ ได้แก่ ${topCategories.map((row) => `“${row.name}” ${number(row.total)} เรื่อง`).join(', ')}`
    : 'ไม่พบข้อมูลจำแนกตามประเภทเรื่อง';
  const agencyText = agencyName
    ? `บทสรุปนี้แสดงเฉพาะเรื่องในความรับผิดชอบของ ${agencyName}`
    : topAgencies.length
      ? `หน่วยงานที่มีเรื่องในความรับผิดชอบสูงสุดตามลำดับ ได้แก่ ${topAgencies.map((row) => `${row.name} ${number(row.total)} เรื่อง`).join(', ')}`
      : 'ยังไม่มีข้อมูลการส่งต่อเรื่องให้หน่วยงาน';
  const peakText = peakMonth
    ? ` เดือนที่มีการรับเรื่องสูงสุดคือเดือน${MONTHS_FULL_TH[(peakMonth.month || 1) - 1]} พ.ศ. ${Number(peakMonth.year) + 543} จำนวน ${number(peakMonth.total)} เรื่อง`
    : '';

  const sla = total === 0
    ? 'ไม่มีข้อมูลเพียงพอสำหรับประเมินสถานการณ์กรอบระยะเวลามาตรฐานในการดำเนินการ (SLA) และการเร่งรัด'
    : `พบเรื่องเกินกรอบระยะเวลามาตรฐานในการดำเนินการ (SLA) ${number(overdue)} เรื่อง คิดเป็นร้อยละ ${percent(overdue, total)} ของเรื่องทั้งหมด มีเรื่องใกล้ครบกำหนด ${number(nearDue)} เรื่อง และมีเรื่องที่ถูกเร่งรัด ${number(escalated)} เรื่อง แบ่งเป็นการเร่งรัดระดับที่ 1 (L1) จำนวน ${number(summary.escalation_l1)} เรื่อง การเร่งรัดระดับที่ 2 (L2) จำนวน ${number(summary.escalation_l2)} เรื่อง และการเร่งรัดระดับที่ 3 (L3) จำนวน ${number(summary.escalation_l3)} เรื่อง`;

  let recommendation = 'ควรตรวจสอบช่วงเวลาและเงื่อนไขที่เลือก ก่อนจัดทำรายงานฉบับสมบูรณ์';
  if (total > 0 && (overdue > 0 || escalated > 0)) {
    recommendation = `ควรเร่งติดตามเรื่องเกินกำหนดและเรื่องที่ถูกเร่งรัด โดยกำหนดผู้รับผิดชอบและรอบรายงานความคืบหน้าให้ชัดเจน${topCategories[0] ? ` พร้อมให้ความสำคัญกับประเภทเรื่อง “${topCategories[0].name}” ซึ่งมีจำนวนสูงสุด` : ''}`;
  } else if (total > 0 && pending > 0) {
    recommendation = `ควรติดตามเรื่องคงค้างจำนวน ${number(pending)} เรื่องอย่างต่อเนื่อง และเตรียมดำเนินการกับเรื่องใกล้ครบกำหนดล่วงหน้า เพื่อลดความเสี่ยงต่อการเกินกรอบระยะเวลามาตรฐานในการดำเนินการ (SLA)`;
  } else if (total > 0) {
    recommendation = 'ควรรักษาระดับการดำเนินงาน ติดตามคุณภาพผลลัพธ์อย่างต่อเนื่อง และทบทวนข้อมูลเป็นระยะ';
  }

  return [
    { title: '1. ภาพรวมผลการดำเนินงาน', text: overview },
    { title: '2. ประเด็นเรื่องและหน่วยงานที่เกี่ยวข้อง', text: `${categoryText} ${agencyText}${peakText}` },
    { title: '3. สถานการณ์กรอบระยะเวลามาตรฐานในการดำเนินการ (SLA) และการเร่งรัด', text: sla },
    { title: '4. ข้อเสนอเพื่อการบริหาร', text: recommendation },
  ];
};

const ExecutiveSummaryTab = ({ agencies }) => {
  const [from, setFrom] = useState(firstOfYear());
  const [to, setTo] = useState(today());
  const [agencyId, setAgencyId] = useState('');
  const [data, setData] = useState({ summary: {}, monthly: [], categories: [], agencies: [] });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(''); setCopied(false);
    try {
      const params = { date_from: from, date_to: to };
      if (agencyId) params.agency_id = agencyId;
      const [summaryRes, monthlyRes, categoryRes, agencyRes] = await Promise.all([
        dashboardApi.getSummary(params),
        reportApi.getMonthly(params),
        reportApi.getByCategory(params),
        agencyId ? Promise.resolve(null) : reportApi.getByAgency({ date_from: from, date_to: to }),
      ]);
      setData({
        summary: summaryRes.data?.data?.summary || {},
        monthly: monthlyRes.data?.data?.report || [],
        categories: categoryRes.data?.data?.report || [],
        agencies: agencyRes?.data?.data?.report || [],
      });
      setLoaded(true);
    } catch {
      setError('โหลดข้อมูลสำหรับบทสรุปไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [from, to, agencyId]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const agencyName = agencies.find((agency) => String(agency.id) === String(agencyId))?.name || '';
  const period = `${longDate(from)} ถึง ${longDate(to)}`;
  const sections = useMemo(() => buildNarrative({
    summary: data.summary,
    categories: data.categories,
    agencyRows: data.agencies,
    monthlyRows: data.monthly,
    period,
    agencyName,
  }), [data, period, agencyName]);
  const copyText = [
    'บทสรุปผู้บริหาร',
    `ช่วงเวลา: ${period}`,
    ...sections.map((section) => `${section.title}\n${section.text}`),
  ].join('\n\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
    } catch {
      setError('คัดลอกบทสรุปไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  return (
    <Box>
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={2}>
        {agencies.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>หน่วยงาน</InputLabel>
            <Select value={agencyId} label="หน่วยงาน" onChange={(event) => setAgencyId(event.target.value)}>
              <MenuItem value="">-- ทั้งหมด --</MenuItem>
              {agencies.map((agency) => (
                <MenuItem key={agency.id} value={String(agency.id)}>{agency.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField type="date" label="ตั้งแต่" size="small" value={from} onChange={(event) => setFrom(event.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
        <TextField type="date" label="ถึง" size="small" value={to} onChange={(event) => setTo(event.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
        <Button variant="outlined" size="small" startIcon={loading ? <CircularProgress size={14} /> : <FilterAltIcon />} onClick={load} disabled={loading} sx={{ height: 40 }}>
          สร้างบทสรุป
        </Button>
      </Box>

      {error && <Typography color="error" variant="body2" mb={1}>{error}</Typography>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {loaded && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
              <Box>
                <Typography variant="h6" fontWeight={700}>บทสรุปผู้บริหาร</Typography>
                <Typography variant="body2" color="text.secondary">สรุปจากข้อมูลในระบบ ช่วงวันที่ {period}</Typography>
              </Box>
              <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                {copied ? 'คัดลอกแล้ว' : 'คัดลอกบทสรุป'}
              </Button>
            </Box>
            <Divider sx={{ my: 2.5 }} />
            {sections.map((section) => (
              <Box key={section.title} mb={2.5}>
                <Typography variant="subtitle1" fontWeight={700} color="primary.dark" gutterBottom>{section.title}</Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.9, textIndent: { md: '2.5em' } }}>{section.text}</Typography>
              </Box>
            ))}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
              <Typography variant="caption" color="text.secondary">
                หมายเหตุ: ข้อความนี้สร้างจากตัวเลขในระบบโดยอัตโนมัติ ควรตรวจสอบความครบถ้วนและปรับถ้อยคำให้เหมาะสมก่อนนำไปใช้ในเอกสารราชการ
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ExecutiveSummaryTab;
