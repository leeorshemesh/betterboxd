import { useRef } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '@/components/Avatar';
import { TimelineRow } from '@/components/TimelineRow';
import { TopFive } from '@/components/TopFive';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { CURRENT_USER_ID } from '@/data/mock/users';

export default function ProfileScreen() {
  const listRef = useRef<FlatList>(null);
  const { currentUser, friends, topFive, setTopFiveMode, getReviewsForUser, getUserComments } =
    useAppState();

  const reviews = getReviewsForUser(CURRENT_USER_ID);
  const myComments = getUserComments(CURRENT_USER_ID);

  const scrollToTop = () => listRef.current?.scrollToOffset({ offset: 0, animated: true });
  const scrollToBottom = () =>
    listRef.current?.scrollToEnd({ animated: true });

  const Header = (
    <View>
      <View style={styles.header}>
        <Avatar user={currentUser} size={72} />
        <View style={styles.headerMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{currentUser.displayName}</Text>
            <Link href="/settings" asChild>
              <Pressable hitSlop={12} accessibilityLabel="Settings">
                <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
              </Pressable>
            </Link>
          </View>
          <Text style={styles.username}>@{currentUser.username}</Text>
          {currentUser.bio ? <Text style={styles.bio}>{currentUser.bio}</Text> : null}
          <View style={styles.stats}>
            <Link href="/friends" asChild>
              <Pressable style={styles.stat}>
                <Text style={styles.statNum}>{friends.length}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </Pressable>
            </Link>
            <Link href="/my-comments" asChild>
              <Pressable style={styles.stat}>
                <Text style={styles.statNum}>{myComments.length}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </Pressable>
            </Link>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>
      </View>

      <TopFive config={topFive} onModeChange={setTopFiveMode} />

      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>Timeline</Text>
        <Text style={styles.timelineHint}>Newest first</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={reviews}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.list}
        onScroll={(_e: NativeSyntheticEvent<NativeScrollEvent>) => {}}
        renderItem={({ item, index }) => (
          <TimelineRow
            review={item}
            isFirst={index === 0}
            isLast={index === reviews.length - 1}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No reviews yet — post one from the Add tab.</Text>
        }
      />

      <View style={styles.jumpBar} pointerEvents="box-none">
        <Pressable style={styles.jumpBtn} onPress={scrollToTop} accessibilityLabel="Jump to top">
          <Ionicons name="arrow-up" size={18} color={colors.bg} />
        </Pressable>
        <Pressable
          style={styles.jumpBtn}
          onPress={scrollToBottom}
          accessibilityLabel="Jump to bottom"
        >
          <Ionicons name="arrow-down" size={18} color={colors.bg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayName: {
    ...typography.title,
    color: colors.text,
  },
  username: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statNum: {
    ...typography.headline,
    color: colors.accent,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  timelineHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  timelineTitle: {
    ...typography.title,
    color: colors.text,
  },
  timelineHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  jumpBar: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  jumpBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
