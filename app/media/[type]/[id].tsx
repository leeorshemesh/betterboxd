import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { MediaArt } from '@/components/MediaArt';
import { StarRating } from '@/components/StarRating';
import { colors, radii, spacing, typography, MEDIA_TYPE_SINGULAR } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getUserById } from '@/data/mock/users';
import { mediaService } from '@/services/mediaService';
import type { MediaItem, MediaType } from '@/types';
import { formatDateShort } from '@/utils/format';

export default function MediaDetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const { getPublicReviewsForMedia, addToList, lists } = useAppState();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    mediaService.getById(id).then((item) => {
      if (!cancelled) {
        setMedia(item);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!media) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Title not found.</Text>
      </View>
    );
  }

  const reviews = getPublicReviewsForMedia(media.id);
  const listKind =
    media.type === 'book' ? 'to-read' : media.type === 'music' ? 'to-listen' : 'to-watch';
  const list = lists.find((l) => l.kind === listKind);
  const alreadyInList = list?.mediaIds.includes(media.id) ?? false;

  const onAddToList = () => {
    const result = addToList(media.id, media.type as MediaType);
    setToast(
      result.added
        ? `Added to ${result.list.name}`
        : `Already on ${result.list.name}`,
    );
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <Stack.Screen options={{ title: media.title }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <MediaArt media={media} size={120} />
          <View style={styles.heroMeta}>
            <Text style={styles.type}>{MEDIA_TYPE_SINGULAR[media.type] ?? type}</Text>
            <Text style={styles.title}>{media.title}</Text>
            <Text style={styles.sub}>
              {media.subtitle}
              {media.year ? ` · ${media.year}` : ''}
            </Text>
            <Text style={styles.genres}>{media.genres.join(' · ')}</Text>
          </View>
        </View>

        <Pressable
          onPress={onAddToList}
          style={[styles.listBtn, alreadyInList && styles.listBtnDone]}
        >
          <Text style={[styles.listBtnText, alreadyInList && styles.listBtnTextDone]}>
            {alreadyInList ? `On ${list?.name ?? 'list'}` : `Add to ${list?.name ?? 'list'}`}
          </Text>
        </Pressable>
        {toast ? <Text style={styles.toast}>{toast}</Text> : null}

        <Text style={styles.section}>Public reviews · {reviews.length}</Text>
        <Text style={styles.sectionHint}>
          Only authors with public profiles are shown (privacy enforced later).
        </Text>

        {reviews.length === 0 ? (
          <Text style={styles.empty}>No public reviews yet.</Text>
        ) : (
          reviews.map((r) => {
            const author = getUserById(r.userId);
            return (
              <Link key={r.id} href={`/review/${r.id}`} asChild>
                <Pressable style={styles.reviewRow}>
                  {author && <Avatar user={author} size={36} />}
                  <View style={{ flex: 1 }}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewAuthor}>{author?.displayName ?? 'User'}</Text>
                      <Text style={styles.reviewDate}>{formatDateShort(r.createdAt)}</Text>
                    </View>
                    <StarRating value={r.rating} size={14} />
                    <Text style={styles.reviewBody} numberOfLines={3}>
                      {r.body}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  missing: { ...typography.body, color: colors.textMuted },
  hero: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  heroMeta: { flex: 1, justifyContent: 'center' },
  type: {
    ...typography.label,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    marginBottom: 4,
  },
  title: { ...typography.display, color: colors.text, fontSize: 24 },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  genres: { ...typography.caption, color: colors.textMuted, marginTop: 8 },
  listBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  listBtnDone: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  listBtnText: { ...typography.bodyBold, color: colors.accent },
  listBtnTextDone: { color: colors.textSecondary },
  toast: {
    ...typography.caption,
    color: colors.teal,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  section: { ...typography.title, color: colors.text, marginTop: spacing.xl, fontSize: 18 },
  sectionHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.textMuted },
  reviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewAuthor: { ...typography.headline, color: colors.text, fontSize: 14 },
  reviewDate: { ...typography.caption, color: colors.textMuted },
  reviewBody: { ...typography.body, color: colors.textSecondary, fontSize: 14, marginTop: 4 },
});
