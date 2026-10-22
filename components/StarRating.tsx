import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, typography } from '@/constants/theme';
import { clampHalfStar } from '@/utils/format';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  style?: ViewStyle;
  showValue?: boolean;
}

/**
 * Half-star rating (0.5–5). Interactive when onChange is provided.
 * Left half of a star = n-0.5, right half / full = n.
 */
export function StarRating({
  value,
  onChange,
  size = 22,
  style,
  showValue = false,
}: StarRatingProps) {
  const interactive = typeof onChange === 'function';
  const rating = value;

  const handlePress = (starIndex: number, half: 'left' | 'right') => {
    if (!onChange) return;
    const next = half === 'left' ? starIndex - 0.5 : starIndex;
    onChange(clampHalfStar(next));
  };

  return (
    <View style={[styles.row, style]}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill =
          rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;

        return (
          <View key={star} style={[styles.starWrap, { width: size, height: size }]}>
            <Text style={[styles.starEmpty, { fontSize: size, lineHeight: size }]}>★</Text>
            {fill > 0 && (
              <View
                style={[
                  styles.starFillClip,
                  { width: size * fill, height: size },
                ]}
              >
                <Text style={[styles.starFilled, { fontSize: size, lineHeight: size }]}>★</Text>
              </View>
            )}
            {interactive && (
              <View style={styles.hitRow}>
                <Pressable
                  style={styles.hitHalf}
                  onPress={() => handlePress(star, 'left')}
                  accessibilityLabel={`${star - 0.5} stars`}
                />
                <Pressable
                  style={styles.hitHalf}
                  onPress={() => handlePress(star, 'right')}
                  accessibilityLabel={`${star} stars`}
                />
              </View>
            )}
          </View>
        );
      })}
      {showValue && (
        <Text style={styles.value}>{rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starWrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  starEmpty: {
    color: colors.starEmpty,
  },
  starFillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  starFilled: {
    color: colors.star,
  },
  hitRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  hitHalf: {
    flex: 1,
  },
  value: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
  },
});
