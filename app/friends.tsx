import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { FriendSearchBlock } from '@/components/FriendSearchBlock';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/services/api';

export default function FriendsScreen() {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
          <FriendSearchBlock />

          {incomingRequests.length > 0 && (
            <>
              <Text style={styles.section}>Requests</Text>
              {incomingRequests.map((request) => (
                <View key={request.id} style={styles.row}>
                  <Link href={`/user/${request.user.username}` as Href} asChild>
                    <Pressable style={styles.profileLink}>
                      <Avatar user={request.user} size={48} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{request.user.displayName}</Text>
                        <Text style={styles.username}>@{request.user.username}</Text>
                      </View>
                    </Pressable>
                  </Link>
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
          <Link href={`/user/${item.username}` as Href} asChild>
            <Pressable style={styles.profileLink}>
              <Avatar user={item} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.privacy}>
                  {item.isPublic ? 'Public profile' : 'Private profile'}
                </Text>
              </View>
            </Pressable>
          </Link>
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
  profileLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
