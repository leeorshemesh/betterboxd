import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/Auth';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/services/api';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { currentUser, updateProfile } = useAppState();
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [isPublic, setIsPublic] = useState(currentUser.isPublic);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(currentUser.displayName);
    setBio(currentUser.bio ?? '');
    setIsPublic(currentUser.isPublic);
  }, [currentUser]);

  const onSave = async () => {
    if (!displayName.trim() || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        isPublic,
      });
      setMessage('Saved');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.label}>Display name</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Username</Text>
      <Text style={styles.locked}>@{currentUser.username}</Text>

      {currentUser.email ? (
        <>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.locked}>{currentUser.email}</Text>
        </>
      ) : null}

      <Text style={styles.label}>Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="A line about what you watch, read, and listen to"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.bio]}
        multiline
      />

      <View style={styles.privacyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Public profile</Text>
          <Text style={styles.privacyHint}>
            {isPublic
              ? 'Anyone signed in can see your diary and reviews.'
              : 'Only friends can see your diary, reviews, and comments.'}
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: colors.border, true: colors.accentDim }}
          thumbColor={isPublic ? colors.accent : colors.textSecondary}
        />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        onPress={onSave}
        disabled={saving || !displayName.trim()}
        style={[styles.save, (saving || !displayName.trim()) && styles.saveDisabled]}
      >
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </Pressable>

      <Pressable onPress={() => void signOut()} style={styles.logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
  },
  bio: { minHeight: 88, textAlignVertical: 'top' },
  locked: { ...typography.body, color: colors.textSecondary },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  privacyTitle: { ...typography.headline, color: colors.text, fontSize: 15 },
  privacyHint: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  message: { ...typography.body, color: colors.teal, marginTop: spacing.md },
  save: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.4 },
  saveText: { ...typography.bodyBold, color: colors.bg, fontSize: 16 },
  logout: { marginTop: spacing.lg, alignItems: 'center', padding: spacing.md },
  logoutText: { ...typography.bodyBold, color: colors.coral },
});
