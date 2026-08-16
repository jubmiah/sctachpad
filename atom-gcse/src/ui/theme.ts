/** Design tokens. Kept in one place so screens stay consistent. */

import type { MasteryLevel } from '@/domain/types';

export const colours = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  border: '#E3E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  success: '#059669',
  successSurface: '#ECFDF5',
  error: '#DC2626',
  errorSurface: '#FEF2F2',
  warning: '#D97706',
  streak: '#F97316',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 34, fontWeight: '800' as const },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
} as const;

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  'not-started': 'Not started',
  developing: 'Developing',
  secure: 'Secure',
  mastered: 'Mastered',
};

export const MASTERY_COLOURS: Record<MasteryLevel, string> = {
  'not-started': '#94A3B8',
  developing: '#D97706',
  secure: '#2563EB',
  mastered: '#059669',
};
