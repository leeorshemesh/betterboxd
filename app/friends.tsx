import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';

export default function FriendsScreen() {
  const { friends } = useAppState();

  return (
    <FlatList
      style={styles.screen}
      data={friends}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.hint}>
          Friend graph is mock data. Add/remove friends comes with auth + backend.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar user={item} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.displayName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.privacy}>
              {item.isPublic ? 'Public profile' : 'Private profile'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { ...typography.headline, color: colors.text },
  username: { ...typography.caption, color: colors.textMuted },
  privacy: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
});
