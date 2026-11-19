import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { TimelineRow } from '@/components/TimelineRow';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { api, ApiError } from '@/services/api';
import { cacheMediaItems } from '@/services/mediaCache';
import type { DiaryEntry, FriendStatus, Review, User } from '@/types';

interface ProfilePayload {
  user: User;
  restricted: boolean;
  friendStatus: FriendStatus;
}

interface DiaryPayload {
  entries: DiaryEntry[];
  reviews: Review[];
}

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ username: string }>();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;
  const router = useRouter();
  const { currentUser, sendFriendRequest, acceptFriendRequest, incomingRequests } = useAppState();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      if (username.toLowerCase() === currentUser.username.toLowerCase()) {
        router.replace('/(tabs)/profile');
        return;
      }
      const payload = await api<ProfilePayload>(`/users/${encodeURIComponent(username)}`);
      setProfile(payload);
      if (!payload.restricted) {
        const diary = await api<DiaryPayload>(`/users/${encodeURIComponent(username)}/diary`);
        cacheMediaItems(diary.entries.map((entry) => entry.media));
        setEntries(diary.entries);
        setReviews(diary.reviews);
      } else {
        setEntries([]);
        setReviews([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username, currentUser.username, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewFor = (entry: DiaryEntry) =>
    entry.reviewId ? reviews.find((review) => review.id === entry.reviewId) : undefined;

  const incoming = profile
    ? incomingRequests.find((request) => request.user.id === profile.user.id)
    : undefined;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'User not found'}</Text>
      </View>
    );
  }

  const { user, restricted, friendStatus } = profile;

  return (
    <>
      <Stack.Screen options={{ title: `@${user.username}` }} />
      <FlatList
        style={styles.screen}
        data={restricted ? [] : entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Avatar user={user} size={72} />
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
            <Text style={styles.privacy}>
              {user.isPublic ? 'Public profile' : 'Private profile'}
              {friendStatus === 'friends' ? ' · Friends' : ''}
            </Text>

            <View style={styles.actions}>
              {friendStatus === 'none' ? (
                <Pressable
                  style={styles.btn}
                  disabled={busy}
                  onPress={() => {
                    setBusy(true);
                    void sendFriendRequest(user.username)
                      .then(load)
                      .finally(() => setBusy(false));
                  }}
                >
                  <Text style={styles.btnText}>Add friend</Text>
                </Pressable>
              ) : null}
              {friendStatus === 'pending_incoming' && incoming ? (
                <Pressable
                  style={styles.btn}
                  disabled={busy}
                  onPress={() => {
                    setBusy(true);
                    void acceptFriendRequest(incoming.id)
                      .then(load)
                      .finally(() => setBusy(false));
                  }}
                >
                  <Text style={styles.btnText}>Accept request</Text>
                </Pressable>
              ) : null}
              {friendStatus === 'pending_outgoing' ? (
                <Text style={styles.status}>Friend request sent</Text>
              ) : null}
            </View>

            {restricted ? (
              <Text style={styles.restricted}>
                This diary is private. Become friends to see what {user.displayName} logs.
              </Text>
            ) : (
              <Text style={styles.timelineTitle}>Timeline</Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <TimelineRow
            entry={item}
            review={reviewFor(item)}
            isFirst={index === 0}
            isLast={index === entries.length - 1}
          />
        )}
        ListEmptyComponent={
          restricted ? undefined : (
            <Text style={styles.empty}>Nothing logged yet.</Text>
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  list: { paddingBottom: spacing.xxl },
  header: {
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: 4,
  },
  displayName: { ...typography.title, color: colors.text, marginTop: spacing.md },
  username: { ...typography.caption, color: colors.textMuted },
  bio: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  privacy: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  actions: { marginTop: spacing.md, marginBottom: spacing.sm },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: { ...typography.bodyBold, color: colors.bg },
  status: { ...typography.body, color: colors.textSecondary },
  restricted: {
    ...typography.body,
    color: colors.amber,
    marginTop: spacing.lg,
  },
  timelineTitle: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  error: { ...typography.body, color: colors.coral, textAlign: 'center' },
});
