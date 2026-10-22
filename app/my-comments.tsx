import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getMediaSync } from '@/services/mediaService';
import { CURRENT_USER_ID } from '@/data/mock/users';
import { formatDateYear } from '@/utils/format';

export default function MyCommentsScreen() {
  const { getUserComments, getReview } = useAppState();
  const comments = getUserComments(CURRENT_USER_ID);

  return (
    <FlatList
      style={styles.screen}
      data={comments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>You haven’t commented on any reviews yet.</Text>
      }
      renderItem={({ item }) => {
        const review = getReview(item.reviewId);
        const media = review ? getMediaSync(review.target.mediaId) : undefined;
        return (
          <Link href={`/review/${item.reviewId}`} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.date}>{formatDateYear(item.createdAt)}</Text>
              <Text style={styles.on}>
                On {media?.title ?? 'a review'}
              </Text>
              <Text style={styles.body}>{item.body}</Text>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  empty: { ...typography.body, color: colors.textMuted },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  date: { ...typography.caption, color: colors.textMuted },
  on: { ...typography.label, color: colors.accent, marginTop: 4 },
  body: { ...typography.body, color: colors.text, marginTop: 4 },
});
