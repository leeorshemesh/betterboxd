import { Link, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AvatarPicker } from '@/components/AvatarPicker';
import { THEME_PRESETS, radii, spacing, typography, MEDIA_TYPE_LABELS } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ApiError } from '@/services/api';
import {
  loadPreferences,
  updatePreferences,
  type AppPreferences,
} from '@/services/preferences';
import type { ThemePresetId } from '@/constants/theme';
import type { FeedFilter, MediaType } from '@/types';

const FEED_FILTERS: FeedFilter[] = ['all', 'movie', 'show', 'book', 'music'];
const ADD_TYPES: MediaType[] = ['movie', 'show', 'book', 'music'];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { currentUser, updateProfile } = useAppState();
  const { preset, setPreset, colors } = useTheme();
  const styles = useThemedStyles(
    useCallback(
      (c) => ({
        screen: { flex: 1, backgroundColor: c.bg },
        content: { padding: spacing.lg, paddingBottom: spacing.xxl },
        section: {
          ...typography.title,
          color: c.text,
          fontSize: 18,
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        },
        label: {
          ...typography.label,
          color: c.textMuted,
          marginBottom: spacing.sm,
          marginTop: spacing.md,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.8,
          fontSize: 11,
        },
        hint: { ...typography.caption, color: c.textMuted, marginBottom: spacing.md },
        input: {
          ...typography.body,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          color: c.text,
        },
        bio: { minHeight: 88, textAlignVertical: 'top' as const },
        locked: { ...typography.body, color: c.textSecondary },
        privacyRow: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: spacing.md,
        },
        privacyTitle: { ...typography.headline, color: c.text, fontSize: 15 },
        privacyHint: { ...typography.caption, color: c.textMuted, marginTop: 4 },
        message: { ...typography.body, color: c.teal, marginTop: spacing.md },
        save: {
          marginTop: spacing.lg,
          backgroundColor: c.accent,
          borderRadius: radii.md,
          paddingVertical: 14,
          alignItems: 'center' as const,
        },
        saveDisabled: { opacity: 0.5 },
        saveText: { ...typography.bodyBold, color: c.bg, fontSize: 16 },
        themeRow: { gap: spacing.md },
        themeCard: {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: radii.md,
          padding: spacing.md,
        },
        themeCardActive: {
          borderColor: c.accent,
          backgroundColor: c.accentSoft,
        },
        swatchRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 8 },
        swatch: {
          width: 28,
          height: 28,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: c.border,
        },
        themeLabel: { ...typography.bodyBold, color: c.text },
        chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: radii.pill,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        },
        chipActive: {
          backgroundColor: c.accentSoft,
          borderColor: c.accentDim,
        },
        chipText: { ...typography.label, color: c.textSecondary },
        chipTextActive: { color: c.accent },
        linkRow: {
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        },
        linkText: { ...typography.body, color: c.accent },
        logout: { paddingVertical: spacing.md },
        logoutText: { ...typography.bodyBold, color: c.coral },
      }),
      [],
    ),
  );

  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [isPublic, setIsPublic] = useState(currentUser.isPublic);
  const [prefs, setPrefs] = useState<AppPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(currentUser.displayName);
    setBio(currentUser.bio ?? '');
    setIsPublic(currentUser.isPublic);
  }, [currentUser]);

  useEffect(() => {
    void loadPreferences().then(setPrefs);
  }, []);

  const onSaveProfile = async () => {
    if (!displayName.trim() || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        isPublic,
      });
      setMessage('Profile saved');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const patchPrefs = async (patch: Partial<AppPreferences>) => {
    const next = await updatePreferences(patch);
    setPrefs(next);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Profile</Text>
      <AvatarPicker size={88} />
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

      <Text style={styles.section}>Privacy</Text>
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

      <Pressable
        onPress={() => void onSaveProfile()}
        disabled={saving || !displayName.trim()}
        style={[styles.save, (saving || !displayName.trim()) && styles.saveDisabled]}
      >
        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.section}>Appearance</Text>
      <Text style={styles.hint}>Pick a palette — applies across the app.</Text>
      <View style={styles.themeRow}>
        {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => {
          const theme = THEME_PRESETS[id];
          const active = preset === id;
          return (
            <Pressable
              key={id}
              onPress={() => setPreset(id)}
              style={[styles.themeCard, active && styles.themeCardActive]}
            >
              <View style={styles.swatchRow}>
                <View style={[styles.swatch, { backgroundColor: theme.colors.bg }]} />
                <View style={[styles.swatch, { backgroundColor: theme.colors.surface }]} />
                <View style={[styles.swatch, { backgroundColor: theme.colors.accent }]} />
              </View>
              <Text style={[styles.themeLabel, active && { color: colors.accent }]}>
                {theme.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Preferences</Text>
      {prefs ? (
        <>
          <Text style={styles.label}>Default Explore filter</Text>
          <View style={styles.chipRow}>
            {FEED_FILTERS.map((value) => (
              <Pressable
                key={value}
                onPress={() => void patchPrefs({ defaultExploreFilter: value })}
                style={[styles.chip, prefs.defaultExploreFilter === value && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    prefs.defaultExploreFilter === value && styles.chipTextActive,
                  ]}
                >
                  {MEDIA_TYPE_LABELS[value]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Default Feed filter</Text>
          <View style={styles.chipRow}>
            {FEED_FILTERS.map((value) => (
              <Pressable
                key={value}
                onPress={() => void patchPrefs({ defaultFeedFilter: value })}
                style={[styles.chip, prefs.defaultFeedFilter === value && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    prefs.defaultFeedFilter === value && styles.chipTextActive,
                  ]}
                >
                  {MEDIA_TYPE_LABELS[value]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Default Add type</Text>
          <View style={styles.chipRow}>
            {ADD_TYPES.map((value) => (
              <Pressable
                key={value}
                onPress={() => void patchPrefs({ defaultAddType: value })}
                style={[styles.chip, prefs.defaultAddType === value && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    prefs.defaultAddType === value && styles.chipTextActive,
                  ]}
                >
                  {MEDIA_TYPE_LABELS[value]}
                </Text>
              </Pressable>
            ))}
          </View>

        </>
      ) : null}

      <Text style={styles.section}>Shortcuts</Text>
      <Link href="/friends" asChild>
        <Pressable style={styles.linkRow}>
          <Text style={styles.linkText}>Friends</Text>
        </Pressable>
      </Link>
      <Link href={'/lists' as Href} asChild>
        <Pressable style={styles.linkRow}>
          <Text style={styles.linkText}>Lists</Text>
        </Pressable>
      </Link>
      <Link href="/my-comments" asChild>
        <Pressable style={styles.linkRow}>
          <Text style={styles.linkText}>My comments</Text>
        </Pressable>
      </Link>

      <Text style={styles.section}>Account</Text>
      <Pressable onPress={() => void signOut()} style={styles.logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
