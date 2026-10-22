import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MediaTypeIcon, labelForMediaFilter } from '@/components/MediaTypeIcon';
import { colors, radii, spacing, typography } from '@/constants/theme';
import type { FeedFilter } from '@/types';

const FILTERS: FeedFilter[] = ['all', 'movie', 'show', 'book', 'music'];

interface FilterChipsProps {
  value: FeedFilter;
  onChange: (value: FeedFilter) => void;
  options?: FeedFilter[];
}

/** Wrapping row so chips never collapse under a FlatList above the fold. */
export function FilterChips({ value, onChange, options = FILTERS }: FilterChipsProps) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt === value;
        const label = labelForMediaFilter(opt);
        const tint = active ? colors.accent : colors.textSecondary;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            hitSlop={4}
          >
            <View style={styles.chipInner}>
              <MediaTypeIcon type={opt} size={16} color={tint} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexGrow: 0,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentDim,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accent,
  },
});
