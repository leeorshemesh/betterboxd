import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';

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

interface FriendSearchBlockProps {
  compact?: boolean;
  title?: string;
}

export function FriendSearchBlock({
  compact = false,
  title = 'Add a friend',
}: FriendSearchBlockProps) {
  const { incomingRequests, searchUsers, sendFriendRequest, acceptFriendRequest } = useAppState();
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
    <View style={compact ? styles.compact : undefined}>
      <Text style={styles.label}>{title}</Text>
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {results.map((hit) => {
        const label = statusLabel(hit.friendStatus);
        const incoming = incomingRequests.find((request) => request.user.id === hit.user.id);
        return (
          <View key={hit.user.id} style={styles.row}>
            <Link href={`/user/${hit.user.username}` as Href} asChild>
              <Pressable style={styles.profileLink}>
                <Avatar user={hit.user} size={compact ? 36 : 40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{hit.user.displayName}</Text>
                  <Text style={styles.username}>@{hit.user.username}</Text>
                </View>
              </Pressable>
            </Link>
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
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    width: '100%',
    marginTop: spacing.lg,
  },
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
  hint: { ...typography.body, color: colors.textMuted },
  error: { ...typography.body, color: colors.coral, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  profileLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: { ...typography.headline, color: colors.text },
  username: { ...typography.caption, color: colors.textMuted },
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
});
