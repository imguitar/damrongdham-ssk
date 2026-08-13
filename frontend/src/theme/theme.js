import { createTheme } from '@mui/material/styles';

// เงานุ่มแบบ minimal — ใช้ซ้ำกับ card / paper / appbar
const SOFT_SHADOW = '0 1px 2px rgba(16,24,40,0.04), 0 10px 28px rgba(16,24,40,0.06)';
const SOFT_SHADOW_HOVER = '0 2px 6px rgba(16,24,40,0.08), 0 16px 40px rgba(16,24,40,0.10)';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#42A5F5',
      lighter: '#E3F0FC',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2E7D32',
      light: '#66BB6A',
      lighter: '#E6F4E9',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    error:   { main: '#E53935', light: '#EF5350', lighter: '#FDECEA', dark: '#C62828' },
    warning: { main: '#F57C00', light: '#FFB74D', lighter: '#FFF3E0', dark: '#E65100' },
    info:    { main: '#0288D1', light: '#4FC3F7', lighter: '#E1F5FE', dark: '#01579B' },
    success: { main: '#2E7D32', light: '#66BB6A', lighter: '#E6F4E9', dark: '#1B5E20' },
    background: {
      default: '#F6F8FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2233',
      secondary: '#5A6B82',
    },
    divider: 'rgba(16,24,40,0.10)',
  },
  typography: {
    fontFamily: '"Kanit", "Sarabun", "Helvetica Neue", "Arial", sans-serif',
    h1: { fontSize: '2rem',    fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.5px' },
    h2: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.4px' },
    h3: { fontSize: '1.5rem',  fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.3px' },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.2px' },
    h5: { fontSize: '1.1rem',  fontWeight: 600, lineHeight: 1.45 },
    h6: { fontSize: '1rem',    fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    // Kanit เป็นฟอนต์เรขาคณิต — เนื้อความใช้ 300 ให้เบา อ่านสบาย ไม่หนาจนอึดอัด
    body1: { fontSize: '0.95rem', fontWeight: 300, lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', fontWeight: 300, lineHeight: 1.6 },
    button: { fontWeight: 500, letterSpacing: 0 },
    caption: { fontWeight: 300 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F6F8FB' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, borderRadius: 10, paddingInline: 16 },
        sizeLarge: { paddingBlock: 9 },
        containedPrimary: { boxShadow: '0 4px 12px rgba(21,101,192,0.24)' },
        containedSecondary: { boxShadow: '0 4px 12px rgba(46,125,50,0.22)' },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(16,24,40,0.08)',
          boxShadow: SOFT_SHADOW,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
        elevation1: { boxShadow: SOFT_SHADOW },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#EAF1FB',
            color: '#0D47A1',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderBottom: '1px solid rgba(16,24,40,0.08)',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F3F7FE' },
          '& .MuiTableCell-root': { borderColor: 'rgba(16,24,40,0.06)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.78rem', borderRadius: 8 },
        sizeSmall: { height: 22 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: 'none', backgroundColor: '#FFFFFF' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 0 rgba(16,24,40,0.06)', borderRadius: 0 },
      },
      defaultProps: { elevation: 0 },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 2,
          '&.Mui-selected': {
            backgroundColor: 'rgba(21,101,192,0.12)',
            color: '#1565C0',
            fontWeight: 500,
            '& .MuiListItemIcon-root': { color: '#1565C0' },
            '&:hover': { backgroundColor: 'rgba(21,101,192,0.18)' },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', fontWeight: 300, borderRadius: 8, backgroundColor: 'rgba(26,34,51,0.92)' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, alignItems: 'center' },
      },
    },
  },
});

// custom hover shadow available to consumers (e.g. clickable cards)
theme.shadowsSoftHover = SOFT_SHADOW_HOVER;

export default theme;
