import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { FeedItem } from '@/components/FeedItem';
import { FilterChips } from '@/components/FilterChips';
import { colors, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useTheme } from '@/context/Theme';
import { loadPreferences } from '@/services/preferences';
import type { FeedFilter } from '@/types';

export default function FeedScreen() {
  const { getFeed, getReview, comments } = useAppState();
  const { colors: c } = useTheme();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const activities = getFeed(filter);

  useEffect(() => {
    void loadPreferences().then((prefs) => setFilter(prefs.defaultFeedFilter));
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.brandBar}>
        <Text style={[styles.brand, { color: c.accent }]}>Betterboxd</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Friends’ activity</Text>
      </View>
      <FilterChips value={filter} onChange={setFilter} />
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyBody}>
              Friend reviews and comments will show up here. Try another filter.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const review = getReview(item.reviewId);
          if (!review) return null;
          const comment =
            item.kind === 'comment' && item.commentId
              ? comments.find((c) => c.id === item.commentId)
              : undefined;
          return <FeedItem activity={item} review={review} comment={comment} />;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  brandBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  brand: {
    ...typography.display,
    fontSize: 26,
  },
  sub: {
    ...typography.caption,
    marginTop: 2,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
