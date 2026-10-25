import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/services/api';
import type { FriendStatus, UserSearchHit } from '@/types';

function statusLabel(status: FriendStatus): string | null {
  if (status === 'friends') return 'Friends';
  if (status === 'pending_outgoing') return 'Requested';
  if (status === 'pending_incoming') return 'Wants to be friends';
  return null;
}

export default function FriendsScreen() {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      setResults(await searchUsers(trimmed));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FlatList
      style={styles.screen}
      data={friends}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <Text style={styles.label}>Add a friend</Text>
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              onSubmitEditing={() => void onSearch()}
            />
            <Pressable style={styles.searchBtn} onPress={() => void onSearch()} disabled={searching}>
              <Text style={styles.searchBtnText}>{searching ? '…' : 'Find'}</Text>
            </Pressable>
          </View>
          {results.map((hit) => {
            const label = statusLabel(hit.friendStatus);
            const incoming = incomingRequests.find((request) => request.user.id === hit.user.id);
            return (
              <View key={hit.user.id} style={styles.row}>
                <Avatar user={hit.user} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{hit.user.displayName}</Text>
                  <Text style={styles.username}>@{hit.user.username}</Text>
                </View>
                {hit.friendStatus === 'none' ? (
                  <Pressable
                    style={styles.smallBtn}
                    disabled={busyId === hit.user.id}
                    onPress={() =>
                      void run(hit.user.id, async () => {
                        await sendFriendRequest(hit.user.username);
                        setResults((prev) =>
                          prev.map((item) =>
                            item.user.id === hit.user.id
                              ? { ...item, friendStatus: 'pending_outgoing' }
                              : item,
                          ),
                        );
                      })
                    }
                  >
                    <Text style={styles.smallBtnText}>Add</Text>
                  </Pressable>
                ) : incoming ? (
                  <Pressable
                    style={styles.smallBtn}
                    disabled={busyId === incoming.id}
                    onPress={() => void run(incoming.id, () => acceptFriendRequest(incoming.id))}
                  >
                    <Text style={styles.smallBtnText}>Accept</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.status}>{label}</Text>
                )}
              </View>
            );
          })}
          {query.trim() && !searching && results.length === 0 ? (
            <Text style={styles.hint}>No one matches that username.</Text>
          ) : null}

          {incomingRequests.length > 0 && (
            <>
              <Text style={styles.section}>Requests</Text>
              {incomingRequests.map((request) => (
                <View key={request.id} style={styles.row}>
                  <Avatar user={request.user} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{request.user.displayName}</Text>
                    <Text style={styles.username}>@{request.user.username}</Text>
                  </View>
                  <Pressable
                    style={styles.smallBtn}
                    disabled={busyId === request.id}
                    onPress={() => void run(request.id, () => acceptFriendRequest(request.id))}
                  >
                    <Text style={styles.smallBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={styles.ghostBtn}
                    disabled={busyId === request.id}
                    onPress={() => void run(request.id, () => declineFriendRequest(request.id))}
                  >
                    <Text style={styles.ghostBtnText}>Decline</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {outgoingRequests.length > 0 && (
            <>
              <Text style={styles.section}>Pending</Text>
              {outgoingRequests.map((request) => (
                <View key={request.id} style={styles.row}>
                  <Avatar user={request.user} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{request.user.displayName}</Text>
                    <Text style={styles.username}>@{request.user.username}</Text>
                  </View>
                  <Text style={styles.status}>Requested</Text>
                </View>
              ))}
            </>
          )}

          <Text style={styles.section}>Friends · {friends.length}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.hint}>No friends yet. Search for a username above.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar user={item} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.displayName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.privacy}>{item.isPublic ? 'Public profile' : 'Private profile'}</Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert('Remove friend', `Remove ${item.displayName}?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => void run(item.id, () => removeFriend(item.id)),
                },
              ])
            }
          >
            <Text style={styles.remove}>Unfriend</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    ...typography.body,
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { ...typography.bodyBold, color: colors.bg },
  section: { ...typography.title, color: colors.text, fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm },
  hint: { ...typography.body, color: colors.textMuted },
  error: { ...typography.body, color: colors.coral, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { ...typography.headline, color: colors.text },
  username: { ...typography.caption, color: colors.textMuted },
  privacy: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  status: { ...typography.caption, color: colors.textSecondary },
  smallBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallBtnText: { ...typography.label, color: colors.accent },
  ghostBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  ghostBtnText: { ...typography.label, color: colors.textSecondary },
  remove: { ...typography.label, color: colors.coral },
});
