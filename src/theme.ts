import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1939B7',
      light: '#4B6CD9',
      dark: '#0F2680',
      lighter: '#E8EDFB',
    },
    secondary: {
      main: '#5119B7',
    },
    success: {
      main: '#22C55E',
      light: '#86EFAC',
      lighter: '#F0FDF4',
    },
    warning: {
      main: '#F59E0B',
      lighter: '#FFFBEB',
    },
    info: {
      main: '#3B82F6',
      lighter: '#EFF6FF',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#1C252E',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C252E',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Public Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h6: { fontWeight: 700, fontSize: '1.125rem' },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    subtitle2: { fontWeight: 700, fontSize: '0.875rem' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Extend palette with `lighter` fields
declare module '@mui/material/styles' {
  interface PaletteColor {
    lighter?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
  }
}

export default theme;
