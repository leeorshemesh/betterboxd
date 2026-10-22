import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

/**
 * Settings stub — auth, privacy, notifications land with real backend.
 */
export default function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.body}>
          Account, privacy (public vs private profiles), and notification preferences will live
          here once auth is wired.
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Theme</Text>
        <Text style={styles.rowValue}>Cinema night (locked)</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Account</Text>
        <Text style={styles.rowValue}>Mock user · auth stub</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Privacy</Text>
        <Text style={styles.rowValue}>Enforcement later</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>API keys</Text>
        <Text style={styles.rowValue}>TMDB / Spotify via env</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.headline, color: colors.text, fontSize: 14 },
  rowValue: { ...typography.caption, color: colors.textMuted },
});
