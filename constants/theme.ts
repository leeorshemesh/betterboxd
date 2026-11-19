/**
 * Betterboxd visual tokens — selectable presets (default: Midnight Coral).
 */

export type ThemePresetId = 'midnightCoral' | 'amberStage' | 'tealReel';

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  accentSoft: string;
  coral: string;
  teal: string;
  amber: string;
  star: string;
  starEmpty: string;
  tabInactive: string;
  tabActive: string;
  overlay: string;
};

export const THEME_PRESETS: Record<
  ThemePresetId,
  { id: ThemePresetId; label: string; colors: ThemeColors }
> = {
  midnightCoral: {
    id: 'midnightCoral',
    label: 'Midnight Coral',
    colors: {
      bg: '#0E1218',
      bgElevated: '#161C26',
      surface: '#1C2430',
      surfaceHover: '#243042',
      border: '#2E3A4A',
      borderSubtle: '#243042',
      text: '#F4F1EC',
      textSecondary: '#A8B0BD',
      textMuted: '#6E7888',
      accent: '#FF6B5A',
      accentDim: '#D45548',
      accentSoft: 'rgba(255, 107, 90, 0.16)',
      coral: '#FF6B5A',
      teal: '#5EC4B8',
      amber: '#E8B84A',
      star: '#FF6B5A',
      starEmpty: '#3A4555',
      tabInactive: '#6E7888',
      tabActive: '#FF6B5A',
      overlay: 'rgba(14, 18, 24, 0.88)',
    },
  },
  amberStage: {
    id: 'amberStage',
    label: 'Amber Stage',
    colors: {
      bg: '#100E0C',
      bgElevated: '#1A1612',
      surface: '#241F19',
      surfaceHover: '#2E2820',
      border: '#3A3228',
      borderSubtle: '#2E2820',
      text: '#F7F1E6',
      textSecondary: '#B8AE9E',
      textMuted: '#7A7164',
      accent: '#E8B84A',
      accentDim: '#C49A3A',
      accentSoft: 'rgba(232, 184, 74, 0.16)',
      coral: '#E85D4C',
      teal: '#5EC4B8',
      amber: '#E8B84A',
      star: '#E8B84A',
      starEmpty: '#3A342C',
      tabInactive: '#7A7164',
      tabActive: '#E8B84A',
      overlay: 'rgba(16, 14, 12, 0.88)',
    },
  },
  tealReel: {
    id: 'tealReel',
    label: 'Teal Reel',
    colors: {
      bg: '#0C1214',
      bgElevated: '#141C20',
      surface: '#1A2428',
      surfaceHover: '#243034',
      border: '#2E3C42',
      borderSubtle: '#243034',
      text: '#EEF3F4',
      textSecondary: '#A3B2B6',
      textMuted: '#6A7A7E',
      accent: '#3DB8A8',
      accentDim: '#2F968A',
      accentSoft: 'rgba(61, 184, 168, 0.16)',
      coral: '#E85D4C',
      teal: '#3DB8A8',
      amber: '#E8B84A',
      star: '#3DB8A8',
      starEmpty: '#2A383C',
      tabInactive: '#6A7A7E',
      tabActive: '#3DB8A8',
      overlay: 'rgba(12, 18, 20, 0.88)',
    },
  },
};

export const DEFAULT_THEME_ID: ThemePresetId = 'midnightCoral';

/** Active palette — ThemeProvider keeps this in sync for StyleSheet modules. */
export let colors: ThemeColors = THEME_PRESETS[DEFAULT_THEME_ID].colors;

export function applyThemeColors(next: ThemeColors): void {
  colors = next;
}

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
