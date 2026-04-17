import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// ── Palette (mirrors src/theme/palette.ts) ──

const palette = {
  primary: {
    lighter: '#c5e4f5',
    light: '#5ba3c5',
    main: '#3980a5',
    dark: '#2d6a8a',
    darker: '#1a4f6b',
    contrastText: '#ffffff',
  },
  secondary: {
    lighter: '#e0e7ff',
    light: '#a5b4fc',
    main: '#6366f1',
    dark: '#4f46e5',
    darker: '#3730a3',
    contrastText: '#ffffff',
  },
  info: {
    lighter: '#cafdf5',
    light: '#61f3f3',
    main: '#00b8d9',
    dark: '#006c9c',
    darker: '#003768',
    contrastText: '#ffffff',
  },
  success: {
    lighter: '#d3fcd2',
    light: '#22c55e',
    main: '#118d57',
    dark: '#0a7b4a',
    darker: '#065e49',
    contrastText: '#ffffff',
  },
  warning: {
    lighter: '#fff5cc',
    light: '#ffd666',
    main: '#ffab00',
    dark: '#b76e00',
    darker: '#7a4100',
    contrastText: '#18181b',
  },
  error: {
    lighter: '#ffe9d5',
    light: '#ffac82',
    main: '#ff5630',
    dark: '#b71d18',
    darker: '#7a0916',
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
    default: '#ffffff',
    paper: '#ffffff',
  },
  divider: 'rgba(145, 158, 171, 0.16)',
  action: {
    active: '#637381',
    hover: 'rgba(145, 158, 171, 0.08)',
    selected: 'rgba(145, 158, 171, 0.16)',
    disabled: 'rgba(145, 158, 171, 0.8)',
    disabledBackground: 'rgba(145, 158, 171, 0.24)',
    focus: 'rgba(145, 158, 171, 0.24)',
  },
} as const;

// ── Shadows (from Figma Design System) ──

const shadows = [
  'none',
  '0px 1px 2px 0px rgba(145, 158, 171, 0.16)',
  '0px 1px 2px 0px rgba(145, 158, 171, 0.20)',
  '0px 2px 4px 0px rgba(145, 158, 171, 0.16)',
  '0px 4px 8px 0px rgba(145, 158, 171, 0.16)',
  '0px 8px 16px 0px rgba(145, 158, 171, 0.16)',
  '0px 12px 24px -4px rgba(145, 158, 171, 0.16)',
  '0px 16px 32px -4px rgba(145, 158, 171, 0.16)',
  '0px 20px 40px -4px rgba(145, 158, 171, 0.16)',
  '0px 24px 48px 0px rgba(145, 158, 171, 0.16)',
  '0px 8px 16px 0px rgba(29, 59, 102, 0.24)',
  '0px 8px 16px 0px rgba(83, 172, 232, 0.24)',
  '0px 8px 16px 0px rgba(0, 184, 217, 0.24)',
  '0px 8px 16px 0px rgba(34, 197, 94, 0.24)',
  '0px 8px 16px 0px rgba(255, 171, 0, 0.24)',
  '0px 8px 16px 0px rgba(255, 86, 48, 0.24)',
  ...Array(9).fill('none'),
] as ThemeOptions['shadows'];

// ── Typography (mirrors src/theme/typography.ts) ──

const typography = {
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  h1: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1.4,
  },
  h4: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
    fontSize: '1.25rem',
    lineHeight: 1.4,
  },
  h5: {
    fontFamily: '"Outfit", sans-serif',
    fontWeight: 700,
    fontSize: '1.125rem',
    lineHeight: 1.5,
  },
  h6: {
    fontFamily: '"Outfit", sans-serif',
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

// ── Component overrides (mirrors src/theme/index.ts) ──

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
      a: { color: palette.primary.main, textDecoration: 'none' },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
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
        borderRadius: 8,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(145, 158, 171, 0.32)' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.text.primary },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: palette.primary.main },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 16, boxShadow: shadows![5] },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
      rounded: { borderRadius: 16 },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: { fontSize: '0.875rem', fontWeight: 600 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 500 },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: { textTransform: 'none', fontWeight: 600 },
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
  shape: { borderRadius: 8 },
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
