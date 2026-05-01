import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// ── Palette (mirrors src/theme/palette.ts — Softriver Brand Refresh) ──

const palette = {
  primary: {
    lighter: '#B8C5D0',
    light: '#4A6274',
    main: '#020B2B',
    dark: '#010818',
    darker: '#00030C',
    contrastText: '#ffffff',
  },
  secondary: {
    lighter: '#FEF6EC',
    light: '#F5D0A0',
    main: '#EEB670',
    dark: '#C99450',
    darker: '#8A6530',
    contrastText: '#18181b',
  },
  info: {
    lighter: '#DBEAFE',
    light: '#60A5FA',
    main: '#3B82F6',
    dark: '#2563EB',
    darker: '#1D4ED8',
    contrastText: '#ffffff',
  },
  success: {
    lighter: '#DCFCE7',
    light: '#4ADE80',
    main: '#16A34A',
    dark: '#15803D',
    darker: '#166534',
    contrastText: '#ffffff',
  },
  warning: {
    lighter: '#FDF4DC',
    light: '#D4A846',
    main: '#B8922E',
    dark: '#8A6B1A',
    darker: '#6B5214',
    contrastText: '#ffffff',
  },
  error: {
    lighter: '#FEE2E2',
    light: '#F87171',
    main: '#DC2626',
    dark: '#B91C1C',
    darker: '#991B1B',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f9fafb',
    200: '#f4f6f8',
    300: '#dfe3e8',
    400: '#c4cdd5',
    500: '#919eab',
    600: '#637381',
    700: '#454f5b',
    800: '#18181b',
    900: '#171721',
  },
  text: {
    primary: '#18181b',
    secondary: '#637381',
    disabled: '#919eab',
  },
  background: {
    default: '#F7F7F5',
    paper: '#ffffff',
  },
  divider: 'rgba(145, 158, 171, 0.20)',
  action: {
    active: '#637381',
    hover: 'rgba(145, 158, 171, 0.08)',
    selected: 'rgba(145, 158, 171, 0.16)',
    disabled: 'rgba(145, 158, 171, 0.8)',
    disabledBackground: 'rgba(145, 158, 171, 0.24)',
    focus: 'rgba(145, 158, 171, 0.24)',
  },
} as const;

// ── Shadows (from main app — flat, subtle) ──

const shadows = [
  'none',
  '0px 1px 2px 0px rgba(145, 158, 171, 0.12)',
  '0px 1px 2px 0px rgba(145, 158, 171, 0.16)',
  '0px 1px 3px 0px rgba(0, 0, 0, 0.06)',
  '0px 2px 4px 0px rgba(145, 158, 171, 0.16)',
  '0px 2px 6px 0px rgba(145, 158, 171, 0.16)',
  '0px 8px 16px -4px rgba(0, 0, 0, 0.08)',
  '0px 8px 16px -4px rgba(0, 0, 0, 0.08)',
  '0px 16px 32px -4px rgba(0, 0, 0, 0.12)',
  '0px 20px 40px -4px rgba(0, 0, 0, 0.12)',
  '0px 4px 12px 0px rgba(2, 11, 43, 0.20)',
  '0px 4px 12px 0px rgba(238, 182, 112, 0.20)',
  '0px 4px 12px 0px rgba(59, 130, 246, 0.20)',
  '0px 4px 12px 0px rgba(22, 163, 74, 0.20)',
  '0px 4px 12px 0px rgba(184, 146, 46, 0.20)',
  '0px 4px 12px 0px rgba(220, 38, 38, 0.20)',
  ...Array(8).fill('none'),
] as ThemeOptions['shadows'];

// ── Typography (Inter — unified font per main app) ──

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const typography = {
  fontFamily: FONT,

  h1: {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1.4,
  },
  h4: {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '1.25rem',
    lineHeight: 1.4,
  },
  h5: {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '1.125rem',
    lineHeight: 1.5,
  },
  h6: {
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  subtitle1: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  subtitle2: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.57,
  },
  body1: {
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.57,
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.5,
  },
  overline: {
    fontWeight: 700,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  button: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.71,
    textTransform: 'none' as const,
  },
};

// ── Component overrides (0px border radius throughout) ──

const components: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      '*': { boxSizing: 'border-box' },
      html: { margin: 0, padding: 0, width: '100%', height: '100%', WebkitOverflowScrolling: 'touch' },
      body: { margin: 0, padding: 0, width: '100%', height: '100%' },
      '#root': { width: '100%', height: '100%' },
      input: {
        '&[type=number]': {
          MozAppearance: 'textfield',
          '&::-webkit-outer-spin-button': { margin: 0, WebkitAppearance: 'none' },
          '&::-webkit-inner-spin-button': { margin: 0, WebkitAppearance: 'none' },
        },
      },
      a: { color: palette.info.main, textDecoration: 'none' },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        textTransform: 'none',
        fontWeight: 600,
      },
      sizeLarge: { height: 48, fontSize: '0.9375rem' },
      sizeMedium: { height: 40 },
      sizeSmall: { height: 32, fontSize: '0.8125rem' },
      containedPrimary: {
        boxShadow: shadows![10],
        '&:hover': {
          boxShadow: shadows![10],
          backgroundColor: palette.primary.dark,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(145, 158, 171, 0.32)' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.text.primary },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: palette.info.main },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 0, boxShadow: shadows![3] },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none', borderRadius: 0 },
      rounded: { borderRadius: 0 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 0 },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: { fontSize: '0.875rem', fontWeight: 600, borderRadius: 0 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 500, borderRadius: 0 },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: { textTransform: 'none', fontWeight: 600 },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: { borderRadius: 0 },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 0 },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: { borderRadius: 0 },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: { borderRadius: 0 },
    },
  },
};

// ── Create theme ──

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: palette.primary,
    secondary: palette.secondary,
    info: palette.info,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    grey: palette.grey,
    text: palette.text,
    background: palette.background,
    divider: palette.divider,
    action: palette.action,
  },
  typography,
  spacing: 8,
  shape: { borderRadius: 0 },
  shadows,
  components,
});

declare module '@mui/material/styles' {
  interface PaletteColor {
    lighter?: string;
    darker?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
  }
}

export default theme;
