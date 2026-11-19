import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/Theme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors) => T | NamedStyles<T>,
): T {
  const { colors, preset } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)) as T, [colors, preset, factory]);
}
