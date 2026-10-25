import { useLocalSearchParams, Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { MediaArt } from '@/components/MediaArt';
import { StarRating } from '@/components/StarRating';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/services/api';
import { getMediaSync } from '@/services/mediaService';
import { formatDayLabel, mediaTargetLabel } from '@/utils/format';

export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reviewId = Array.isArray(id) ? id[0] : id;
  const { getReview, getCommentsForReview, addComment, loadReview, getUser } = useAppState();
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reviewId) return;
    let cancelled = false;
    setLoading(true);
    loadReview(reviewId)
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load review');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewId, loadReview]);

  const review = reviewId ? getReview(reviewId) : undefined;
  if (loading && !review) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      </View>
    );
  }
  if (!review) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>{error ?? 'Review not found.'}</Text>
      </View>
    );
  }

  const user = review.author ?? getUser(review.userId);
  const media = review.media ?? getMediaSync(review.target.mediaId);
  const comments = getCommentsForReview(review.id);
  const target = media ? mediaTargetLabel(media, review.target) : '';

  const onReply = () => {
    const body = reply.trim();
    if (!body) return;
    void addComment(review.id, body).then(() => setReply('')).catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Could not post comment');
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: media?.title ?? 'Review' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {user && (
          <View style={styles.author}>
            <Avatar user={user} size={44} />
            <View>
              <Text style={styles.authorName}>{user.displayName}</Text>
              <Text style={styles.date}>{formatDayLabel(review.loggedOn ?? review.createdAt, true)}</Text>
              {!user.isPublic && (
                <Text style={styles.privacy}>Private profile — comments are visible to friends.</Text>
              )}
            </View>
          </View>
        )}

        {media && (
          <Link href={`/media/${media.type}/${media.id}`} asChild>
            <Pressable style={styles.mediaRow}>
              <MediaArt media={media} size={72} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mediaTitle}>{media.title}</Text>
                <Text style={styles.mediaSub}>
                  {media.subtitle}
                  {target ? ` · ${target}` : ''}
                </Text>
              </View>
            </Pressable>
          </Link>
        )}

        <StarRating value={review.rating} size={24} showValue />
        <Text style={styles.body}>{review.body}</Text>

        {review.tags.length > 0 && (
          <View style={styles.tags}>
            {review.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.section}>
          Comments · {comments.length}
        </Text>

        {comments.map((c) => {
          const cu = c.author ?? getUser(c.userId);
          return (
            <View key={c.id} style={styles.comment}>
              {cu && <Avatar user={cu} size={32} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.commentMeta}>
                  <Text style={styles.commentName}>{cu?.displayName ?? 'User'}</Text>
                  {' · '}
                  {formatDayLabel(c.createdAt, true)}
                </Text>
                <Text style={styles.commentBody}>{c.body}</Text>
                {c.visibilityNote ? (
                  <Text style={styles.visibility}>{c.visibilityNote}</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {error ? <Text style={styles.privacy}>{error}</Text> : null}
        <View style={styles.replyBox}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Add a comment…"
            placeholderTextColor={colors.textMuted}
            style={styles.replyInput}
            multiline
          />
          <Pressable
            onPress={onReply}
            disabled={!reply.trim()}
            style={[styles.replyBtn, !reply.trim() && { opacity: 0.4 }]}
          >
            <Text style={styles.replyBtnText}>Reply</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  missing: { ...typography.body, color: colors.textMuted, padding: spacing.lg },
  author: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  authorName: { ...typography.headline, color: colors.text },
  date: { ...typography.caption, color: colors.textMuted },
  privacy: { ...typography.caption, color: colors.amber, marginTop: 4 },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaTitle: { ...typography.title, color: colors.text, fontSize: 18 },
  mediaSub: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  body: { ...typography.body, color: colors.text, marginTop: spacing.md, fontSize: 16, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(94,196,184,0.12)',
  },
  tagText: { ...typography.caption, color: colors.teal },
  section: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 18,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  commentMeta: { ...typography.caption, color: colors.textMuted },
  commentName: { color: colors.text, fontFamily: 'DMSans_600SemiBold' },
  commentBody: { ...typography.body, color: colors.text, marginTop: 4, fontSize: 14 },
  visibility: { ...typography.caption, color: colors.amber, marginTop: 4 },
  replyBox: { marginTop: spacing.md, gap: spacing.sm },
  replyInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.text,
    minHeight: 72,
  },
  replyBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  replyBtnText: { ...typography.bodyBold, color: colors.bg },
});
