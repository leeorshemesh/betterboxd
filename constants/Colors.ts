import { colors } from '@/constants/theme';

/**
 * Legacy Expo template colors — mirrors the active theme palette.
 */
const tintColorLight = colors.accent;
const tintColorDark = colors.accent;

export default {
  light: {
    text: colors.text,
    background: colors.bg,
    tint: tintColorLight,
    tabIconDefault: colors.tabInactive,
    tabIconSelected: colors.tabActive,
  },
  dark: {
    text: colors.text,
    background: colors.bg,
    tint: tintColorDark,
    tabIconDefault: colors.tabInactive,
    tabIconSelected: colors.tabActive,
  },
};
