import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { MediaArt } from '@/components/MediaArt';
import { StarRating } from '@/components/StarRating';
import { colors, spacing, typography } from '@/constants/theme';
import { getMediaSync } from '@/services/mediaService';
import { getUserById } from '@/data/mock/users';
import type { Comment, FeedActivity, Review } from '@/types';
import { formatDateShort, mediaTargetLabel } from '@/utils/format';

interface FeedItemProps {
  activity: FeedActivity;
  review: Review;
  comment?: Comment;
}

export function FeedItem({ activity, review, comment }: FeedItemProps) {
  const user = getUserById(activity.userId);
  const media = getMediaSync(review.target.mediaId);
  if (!user || !media) return null;

  const target = mediaTargetLabel(media, review);
  const isComment = activity.kind === 'comment';

  return (
    <Link href={`/review/${review.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.header}>
          <Avatar user={user} size={36} />
          <View style={styles.headerText}>
            <Text style={styles.meta}>
              <Text style={styles.name}>{user.displayName}</Text>
              {isComment ? ' commented on a review of ' : ' reviewed '}
              <Text style={styles.title}>{media.title}</Text>
              {target ? ` (${target})` : ''}
            </Text>
            <Text style={styles.date}>{formatDateShort(activity.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.bodyRow}>
          <MediaArt media={media} size={52} />
          <View style={styles.bodyCopy}>
            {!isComment && <StarRating value={review.rating} size={16} />}
            <Text style={styles.body} numberOfLines={3}>
              {isComment && comment ? comment.body : review.body}
            </Text>
            {!isComment && review.tags.length > 0 && (
              <Text style={styles.tags} numberOfLines={1}>
                {review.tags.map((t) => `#${t}`).join('  ')}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  name: {
    ...typography.bodyBold,
    color: colors.text,
  },
  title: {
    color: colors.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  bodyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginLeft: 48,
  },
  bodyCopy: {
    flex: 1,
    gap: 4,
  },
  body: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  tags: {
    ...typography.caption,
    color: colors.teal,
    marginTop: 2,
  },
});
