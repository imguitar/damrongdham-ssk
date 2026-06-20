import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2E7D32',
      light: '#43A047',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    error:   { main: '#C62828' },
    warning: { main: '#E65100' },
    info:    { main: '#0277BD' },
    success: { main: '#2E7D32' },
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#546E7A',
    },
  },
  typography: {
    fontFamily: '"Sarabun", "Helvetica Neue", "Arial", sans-serif',
    h1: { fontSize: '2rem',    fontWeight: 700, lineHeight: 1.3 },
    h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem',  fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.1rem',  fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem',    fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#1565C0',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
          '&:hover': { backgroundColor: '#EEF2FF' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.8rem' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 4px rgba(0,0,0,0.12)' },
      },
      defaultProps: { elevation: 0 },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 2,
          '&.Mui-selected': {
            backgroundColor: 'rgba(21,101,192,0.12)',
            color: '#1565C0',
            '& .MuiListItemIcon-root': { color: '#1565C0' },
            '&:hover': { backgroundColor: 'rgba(21,101,192,0.18)' },
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
  },
});

export default theme;
