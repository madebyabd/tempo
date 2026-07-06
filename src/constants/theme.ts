export const colors = {
  light: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    text: '#15181D',
    muted: '#667085',
    border: '#D9DEE7',
    accent: '#127457',
    accentSoft: '#DDF5EC',
    warning: '#A45F00',
    warningSoft: '#FFE8C2',
    danger: '#B4233A',
  },
  dark: {
    background: '#101114',
    surface: '#181B20',
    surfaceRaised: '#20242B',
    text: '#F4F7FA',
    muted: '#A7B0BE',
    border: '#303741',
    accent: '#61D3A3',
    accentSoft: '#173B2D',
    warning: '#FFBE63',
    warningSoft: '#3D2B13',
    danger: '#FF6F82',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  pill: 999,
} as const;

export const typography = {
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 22,
    xl: 30,
    display: 44,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    md: 26,
    lg: 30,
    xl: 38,
    display: 48,
  },
} as const;

export const layout = {
  maxContentWidth: 720,
} as const;

export type AppThemeName = keyof typeof colors;
export type AppTheme = (typeof colors)[AppThemeName];
