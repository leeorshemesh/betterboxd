import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { MediaArt } from '@/components/MediaArt';
import { StarRating } from '@/components/StarRating';
import { colors, spacing, typography } from '@/constants/theme';
import { getMediaSync } from '@/services/mediaService';
import type { Review } from '@/types';
import { formatDateShort, mediaTargetLabel } from '@/utils/format';

interface TimelineRowProps {
  review: Review;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * Profile timeline row: date left, vertical line, art + meta right.
 */
export function TimelineRow({ review, isFirst, isLast }: TimelineRowProps) {
  const media = getMediaSync(review.target.mediaId);
  if (!media) return null;
  const target = mediaTargetLabel(media, review);

  return (
    <Link href={`/review/${review.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.date}>{formatDateShort(review.createdAt)}</Text>
          <View style={styles.rail}>
            {!isFirst && <View style={styles.railTop} />}
            <View style={styles.dot} />
            {!isLast && <View style={styles.railBottom} />}
          </View>
        </View>

        <View style={styles.right}>
          <MediaArt media={media} size={64} />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={2}>
              {media.title}
            </Text>
            {target ? <Text style={styles.target}>{target}</Text> : null}
            <StarRating value={review.rating} size={14} />
            <Text style={styles.interactions}>
              {review.interactionCount} interaction{review.interactionCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingRight: spacing.lg,
    minHeight: 96,
  },
  left: {
    width: 72,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
    width: 44,
    textAlign: 'right',
    marginTop: 8,
    marginRight: 8,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  railTop: {
    width: 2,
    flex: 0,
    height: 12,
    backgroundColor: colors.border,
  },
  railBottom: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginVertical: 2,
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
  },
  meta: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    ...typography.headline,
    color: colors.text,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  interactions: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
