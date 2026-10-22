import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

/**
 * Phase 1 placeholder — forums by genre / media type come later.
 * Tab is present so navigation shell matches the full product.
 */
export default function CommunityScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>Community</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.body}>
          Forum-style discussions by genre and media type will live here. Phase 1 ships the tab
          shell only — no threads yet.
        </Text>
        <View style={styles.stub}>
          <Text style={styles.stubLabel}>Planned sections</Text>
          <Text style={styles.stubItem}>· Genre forums (thriller, sci-fi, literary…)</Text>
          <Text style={styles.stubItem}>· Media-type rooms (movies, shows, books, music)</Text>
          <Text style={styles.stubItem}>· Thread replies & moderation (post-auth)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  brand: {
    ...typography.display,
    color: colors.accent,
    fontSize: 26,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  stub: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stubLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  stubItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
