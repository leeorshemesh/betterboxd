import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { FeedItem } from '@/components/FeedItem';
import { FilterChips } from '@/components/FilterChips';
import { FriendSearchBlock } from '@/components/FriendSearchBlock';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useTheme } from '@/context/Theme';
import { loadPreferences } from '@/services/preferences';
import type { FeedFilter } from '@/types';

export default function FeedScreen() {
  const { friends, getFeed, getReview, comments } = useAppState();
  const { colors: c } = useTheme();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const activities = getFeed(filter);
  const allActivities = getFeed('all');
  const noFriends = friends.length === 0;

  useEffect(() => {
    void loadPreferences().then((prefs) => setFilter(prefs.defaultFeedFilter));
  }, []);

  let emptyTitle = 'No activity yet';
  let emptyBody = 'Friend reviews and comments will show up here.';
  if (noFriends) {
    emptyTitle = 'Add friends to see activity';
    emptyBody = 'Search for a username below to find people and start your feed.';
  } else if (filter !== 'all' && allActivities.length > 0) {
    emptyTitle = 'Nothing for this filter';
    emptyBody = 'Try another media type, or switch back to All.';
  } else if (!noFriends) {
    emptyBody = 'When friends log titles or leave comments, they show up here.';
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.brandBar}>
        <View style={styles.brandRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.brand, { color: c.accent }]}>Betterboxd</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>Friends’ activity</Text>
          </View>
          <Link href={'/friends' as Href} asChild>
            <Pressable style={styles.friendsLink}>
              <Text style={styles.friendsLinkText}>Friends</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      <FilterChips value={filter} onChange={setFilter} />
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={activities.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyBody}>{emptyBody}</Text>
            {noFriends ? <FriendSearchBlock compact title="Find friends" /> : null}
          </View>
        }
        renderItem={({ item }) => {
          const review = getReview(item.reviewId);
          if (!review) return null;
          const comment =
            item.kind === 'comment' && item.commentId
              ? comments.find((entry) => entry.id === item.commentId)
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brand: {
    ...typography.display,
    fontSize: 26,
  },
  sub: {
    ...typography.caption,
    marginTop: 2,
  },
  friendsLink: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  friendsLinkText: {
    ...typography.label,
    color: colors.accent,
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
