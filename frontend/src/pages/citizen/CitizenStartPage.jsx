import { Link as RouterLink, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import appIcon from '../../components/icons/app-icon-v3.png';
import {
  QuickSubmitIllustration,
  MemberLoginIllustration,
  TrackStatusIllustration,
} from '../../components/citizen/EntryModeIllustrations';

// โหมดเข้าใช้งานสำหรับประชาชน — เลือกก่อนไปหน้าที่เกี่ยวข้อง
const ENTRY_MODES = [
  {
    key: 'quick',
    to: '/public/complaints/new',
    Illustration: QuickSubmitIllustration,
    color: '#1565C0',
    tint: '#E3F0FC',
    badge: 'ไม่ต้องเข้าสู่ระบบ',
    title: 'ยื่นเรื่องทันที',
    description: 'กรอกแบบฟอร์มและส่งเรื่องร้องเรียนได้เลย โดยไม่ต้องสมัครสมาชิก',
    benefits: [
      'รวดเร็ว ไม่ต้องสร้างบัญชี',
      'เลือกไม่เปิดเผยตัวตนได้',
      'ได้รับรหัสติดตามไว้ตรวจสอบภายหลัง',
    ],
    cta: 'เริ่มยื่นเรื่อง',
  },
  {
    key: 'login',
    to: '/citizen/login',
    Illustration: MemberLoginIllustration,
    color: '#2E7D32',
    tint: '#E6F4E9',
    badge: 'แนะนำ',
    title: 'เข้าสู่ระบบ',
    description: 'เข้าสู่ระบบด้วยอีเมลหรือ LINE เพื่อยื่นและดูแลเรื่องของคุณได้ครบในที่เดียว',
    benefits: [
      'ดูรายการเรื่องของฉันได้ทั้งหมด',
      'รับแจ้งเตือนความคืบหน้าผ่าน LINE',
      'ไม่ต้องกรอกข้อมูลส่วนตัวซ้ำ',
    ],
    cta: 'ไปหน้าเข้าสู่ระบบ',
  },
  {
    key: 'track',
    to: '/public/track',
    Illustration: TrackStatusIllustration,
    color: '#E65100',
    tint: '#FFF3E0',
    badge: 'ใช้รหัสติดตาม',
    title: 'ติดตามสถานะเรื่อง',
    description: 'ตรวจสอบความคืบหน้าของเรื่องที่ยื่นไว้แล้ว ด้วยรหัสติดตาม 4 ตัวอักษร',
    benefits: [
      'ไม่ต้องเข้าสู่ระบบ',
      'เห็นสถานะและกำหนดแล้วเสร็จ',
      'ตรวจสอบได้ทุกที่ ทุกเวลา',
    ],
    cta: 'ตรวจสอบสถานะ',
  },
];

const EntryModeCard = ({ mode }) => {
  const { to, Illustration, color, tint, badge, title, description, benefits, cta } = mode;
  return (
    <Paper
      component={RouterLink}
      to={to}
      elevation={0}
      aria-label={`${title} — ${description}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 10px 28px rgba(16,24,40,0.06)',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        '&:hover, &:focus-visible': {
          transform: 'translateY(-4px)',
          borderColor: color,
          boxShadow: '0 2px 6px rgba(16,24,40,0.08), 0 18px 44px rgba(16,24,40,0.12)',
        },
        '&:focus-visible': { outline: `3px solid ${color}`, outlineOffset: 2 },
        '&:hover .entry-cta-arrow, &:focus-visible .entry-cta-arrow': { transform: 'translateX(4px)' },
      }}
    >
      {/* ภาพประกอบ */}
      <Box sx={{ position: 'relative', bgcolor: tint, px: 3, pt: 3, pb: 1.5 }}>
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            px: 1.25,
            py: 0.25,
            borderRadius: 999,
            bgcolor: '#fff',
            color,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 1px 3px rgba(16,24,40,0.08)',
          }}
        >
          {badge}
        </Box>
        <Box sx={{ height: { xs: 120, md: 140 }, mx: 'auto', maxWidth: 200 }}>
          <Illustration />
        </Box>
      </Box>

      {/* เนื้อหา */}
      <Stack spacing={1.5} sx={{ p: 3, flex: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {description}
          </Typography>
        </Box>

        <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', p: 0, m: 0, flex: 1 }}>
          {benefits.map((b) => (
            <Stack component="li" key={b} direction="row" spacing={1} alignItems="flex-start">
              <CheckCircleIcon sx={{ fontSize: 16, color, mt: '3px' }} />
              <Typography variant="caption" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                {b}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pt: 1.5, borderTop: '1px dashed', borderColor: 'divider', color, fontWeight: 600 }}
        >
          <Typography component="span" fontWeight={600} sx={{ color }}>
            {cta}
          </Typography>
          <ArrowForwardIcon className="entry-cta-arrow" fontSize="small" sx={{ transition: 'transform .2s ease' }} />
        </Stack>
      </Stack>
    </Paper>
  );
};

const CitizenStartPage = () => {
  const { citizen } = useCitizenAuth();
  if (citizen) return <Navigate to="/citizen/complaints" replace />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 4, md: 6 },
        bgcolor: '#FAFBFD',
        backgroundImage:
          'radial-gradient(1100px 460px at 50% -8%, rgba(46,125,50,0.07), transparent 60%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1080 }}>
        {/* Brand */}
        <Stack alignItems="center" spacing={1.5} mb={{ xs: 3.5, md: 5 }}>
          <Box
            component="img"
            src={appIcon}
            alt="Sisaket E-CMS"
            sx={{ width: 64, height: 64, borderRadius: 2.5, boxShadow: '0 6px 16px rgba(16,24,40,0.14)' }}
          />
          <Box textAlign="center">
            <Typography variant="h3" component="h1" fontWeight={700}>
              ร้องเรียน / ร้องทุกข์{' '}
              <Box component="span" sx={{ whiteSpace: 'nowrap' }}>ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ</Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={0.75}>
              เลือกรูปแบบการใช้งานที่เหมาะกับคุณ
            </Typography>
          </Box>
        </Stack>

        {/* กล่องเลือกโหมด 3 แบบ */}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {ENTRY_MODES.map((mode) => (
            <EntryModeCard key={mode.key} mode={mode} />
          ))}
        </Box>

        <Stack alignItems="center" spacing={0.75} mt={{ xs: 3.5, md: 5 }}>
          <Typography variant="body2" color="text.secondary">
            ยังไม่มีบัญชี?{' '}
            <Link component={RouterLink} to="/citizen/register" fontWeight={700} underline="hover" color="success.dark">
              สมัครสมาชิก
            </Link>
            {' · '}
            <Link component={RouterLink} to="/public/manual" underline="hover" color="text.secondary">
              คู่มือการใช้งาน
            </Link>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            เป็นเจ้าหน้าที่?{' '}
            <Link component={RouterLink} to="/login" color="inherit" underline="hover" fontWeight={600}>
              เข้าสู่ระบบสำหรับเจ้าหน้าที่
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default CitizenStartPage;
