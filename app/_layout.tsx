import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { AppStateProvider } from '@/context/AppState';
import { AuthProvider, useAuth } from '@/context/Auth';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status, bootError, retryBoot, forgetSession } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.gate}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={styles.gate}>
        <Text style={styles.errorTitle}>Can’t reach your account</Text>
        <Text style={styles.errorBody}>{bootError}</Text>
        <Pressable style={styles.retry} onPress={retryBoot}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
        <Pressable onPress={forgetSession}>
          <Text style={styles.link}>Use a different account</Text>
        </Pressable>
      </View>
    );
  }

  const signedIn = status === 'signedIn';
  const stack = (
    <View style={styles.app}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.accent,
          headerTitleStyle: {
            fontFamily: 'DMSans_600SemiBold',
            color: colors.text,
          },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Protected guard={signedIn} redirectTo="/sign-in">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="review/[id]" options={{ title: 'Review' }} />
          <Stack.Screen name="media/[type]/[id]" options={{ title: 'Title' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
          <Stack.Screen name="friends" options={{ title: 'Friends' }} />
          <Stack.Screen name="my-comments" options={{ title: 'My Comments' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="sign-in" options={{ headerShown: false, title: 'Sign in' }} />
        </Stack.Protected>
      </Stack>
    </View>
  );

  if (!signedIn) return stack;
  return <AppStateProvider>{stack}</AppStateProvider>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  gate: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: { ...typography.title, color: colors.text, textAlign: 'center' },
  errorBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retry: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { ...typography.bodyBold, color: colors.bg },
  link: { ...typography.body, color: colors.accent },
});
