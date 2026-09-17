import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

// ช่องยอมรับประกาศความเป็นส่วนตัว (PDPA) — ใช้ร่วมกันในหน้าสมัคร/ยืนยันโปรไฟล์/ยืนยันการยินยอม
const PrivacyConsentCheckbox = ({ checked, onChange, disabled, error, sx }) => (
  <>
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />}
      label={
        <Typography variant="body2">
          ข้าพเจ้าได้อ่านและยอมรับ{' '}
          <Link href={`${import.meta.env.BASE_URL}public/privacy`} target="_blank" rel="noopener" fontWeight={600}>
            ประกาศความเป็นส่วนตัว
          </Link>{' '}
          และยินยอมให้ศูนย์ดำรงธรรมเก็บและใช้ข้อมูลส่วนบุคคล
          เพื่อการรับเรื่องร้องเรียนและติดต่อกลับ ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
        </Typography>
      }
      sx={{ alignItems: 'flex-start', ...sx }}
    />
    {error && <FormHelperText error sx={{ ml: 4 }}>{error}</FormHelperText>}
  </>
);

export default PrivacyConsentCheckbox;
