import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/Auth';
import { ApiError } from '@/services/api';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    !submitting &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    (mode === 'in' || (username.trim().length >= 3 && displayName.trim().length > 0));

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
      } else {
        await signUp({
          email: email.trim(),
          password,
          username: username.trim(),
          displayName: displayName.trim(),
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Betterboxd</Text>
        <Text style={styles.heading}>{mode === 'in' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.sub}>
          {mode === 'in'
            ? 'Sign in to your diary, friends, and reviews.'
            : 'Pick a username. You can change your display name later.'}
        </Text>

        {mode === 'up' && (
          <>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Leeor"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="leeor"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'in' ? 'up' : 'in');
            setError(null);
          }}
          style={styles.switchMode}
        >
          <Text style={styles.switchText}>
            {mode === 'in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: spacing.xxl * 2, gap: 4 },
  brand: { ...typography.display, color: colors.accent, fontSize: 28, marginBottom: spacing.lg },
  heading: { ...typography.title, color: colors.text },
  sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
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
  error: { ...typography.body, color: colors.coral, marginTop: spacing.md },
  submit: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { ...typography.bodyBold, color: colors.bg, fontSize: 16 },
  switchMode: { marginTop: spacing.lg, alignItems: 'center' },
  switchText: { ...typography.body, color: colors.accent },
});
