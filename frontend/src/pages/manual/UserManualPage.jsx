import { useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import { MANUAL_AUDIENCE_LABELS, MANUAL_AUDIENCE_ORDER, MANUAL_GUIDES } from './manualContent';

const MANUAL_ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const NumberedSteps = ({ steps }) => (
  <List disablePadding>
    {steps.map((step, index) => (
      <ListItem key={step} alignItems="flex-start" disableGutters sx={{ py: 0.65 }}>
        <ListItemIcon sx={{ minWidth: 38, mt: 0.15 }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              bgcolor: 'primary.50',
              color: 'primary.main',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {index + 1}
          </Box>
        </ListItemIcon>
        <ListItemText primary={step} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.7 }} />
      </ListItem>
    ))}
  </List>
);

export const ManualGuide = ({ audience }) => {
  const guide = MANUAL_GUIDES[audience];
  const label = MANUAL_AUDIENCE_LABELS[audience];

  if (!guide) return null;

  return (
    <Stack spacing={3} component="article" aria-labelledby={`manual-${audience}-title`}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'primary.50', borderColor: 'primary.100' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Box
            sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', flexShrink: 0 }}
          >
            <MenuBookIcon fontSize="large" />
          </Box>
          <Box>
            <Chip label={label} size="small" color="primary" sx={{ mb: 1 }} />
            <Typography id={`manual-${audience}-title`} variant="h5" component="h2" fontWeight={700} gutterBottom>
              คู่มือการใช้งานสำหรับ{label}
            </Typography>
            <Typography color="text.secondary">{guide.summary}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <PlayCircleOutlineIcon color="primary" />
                <Typography variant="h6" component="h3" fontWeight={700}>เริ่มต้นใช้งาน</Typography>
              </Stack>
              <NumberedSteps steps={guide.quickStart} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CheckCircleOutlineIcon color="success" />
                <Typography variant="h6" component="h3" fontWeight={700}>ลำดับงานหลัก</Typography>
              </Stack>
              <NumberedSteps steps={guide.workflow} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <TipsAndUpdatesOutlinedIcon color="primary" />
          <Typography variant="h6" component="h3" fontWeight={700}>วิธีใช้งานแต่ละส่วน</Typography>
        </Stack>
        <Grid container spacing={2}>
          {guide.sections.map((section) => (
            <Grid item xs={12} lg={6} key={section.title}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" component="h4" fontWeight={700}>{section.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.25, lineHeight: 1.7 }}>
                    {section.description}
                  </Typography>
                  <Divider />
                  <NumberedSteps steps={section.steps} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Alert severity="warning" icon={<ReportProblemOutlinedIcon />}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>ข้อควรระวัง</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {guide.cautions.map((caution) => <li key={caution}><Typography variant="body2">{caution}</Typography></li>)}
        </Box>
      </Alert>
    </Stack>
  );
};

const UserManualPage = ({ audience }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canBrowseAll = !audience && MANUAL_ADMIN_ROLES.includes(user?.role);
  const availableAudiences = canBrowseAll ? MANUAL_AUDIENCE_ORDER : [audience || user?.role].filter(Boolean);
  const requestedAudience = searchParams.get('role');

  const activeAudience = canBrowseAll && availableAudiences.includes(requestedAudience)
    ? requestedAudience
    : audience || user?.role || 'public';

  const handleAudienceChange = (_event, value) => {
    setSearchParams({ role: value }, { replace: true });
  };

  return (
    <Box maxWidth={1280} mx="auto">
      <PageHeader
        icon={<MenuBookIcon />}
        title="คู่มือการใช้งาน"
        subtitle={canBrowseAll ? 'เลือกดูวิธีใช้งานและข้อควรระวังของผู้ใช้งานแต่ละกลุ่ม' : 'แสดงขั้นตอนและสิทธิ์ที่เกี่ยวข้องกับการใช้งานของคุณ'}
      />

      {canBrowseAll && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Tabs
            value={activeAudience}
            onChange={handleAudienceChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="เลือกคู่มือตามบทบาทผู้ใช้งาน"
            sx={{ px: 1 }}
          >
            {availableAudiences.map((role) => (
              <Tab key={role} value={role} label={MANUAL_AUDIENCE_LABELS[role]} />
            ))}
          </Tabs>
        </Paper>
      )}

      <ManualGuide audience={activeAudience} />
    </Box>
  );
};

export default UserManualPage;
