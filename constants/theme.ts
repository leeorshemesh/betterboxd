/**
 * Betterboxd visual tokens — cinema-night charcoal with chartreuse accent.
 * Distinct from Letterboxd's neon green and from generic purple/cream AI themes.
 */
export const colors = {
  bg: '#121410',
  bgElevated: '#1A1F1B',
  surface: '#222823',
  surfaceHover: '#2A312B',
  border: '#343B35',
  borderSubtle: '#2A312B',

  text: '#F0F2EC',
  textSecondary: '#A8AFA3',
  textMuted: '#6E7568',

  accent: '#D4FF4A',
  accentDim: '#A8C93A',
  accentSoft: 'rgba(212, 255, 74, 0.14)',

  coral: '#E85D4C',
  teal: '#5EC4B8',
  amber: '#E8B84A',

  star: '#D4FF4A',
  starEmpty: '#3A423C',

  tabInactive: '#6E7568',
  tabActive: '#D4FF4A',

  overlay: 'rgba(18, 20, 16, 0.85)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  mono: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  all: 'All',
  movie: 'Movies',
  show: 'Shows',
  book: 'Books',
  music: 'Music',
};

export const MEDIA_TYPE_SINGULAR: Record<string, string> = {
  movie: 'Movie',
  show: 'Show',
  book: 'Book',
  music: 'Music',
};
