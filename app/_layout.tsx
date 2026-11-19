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
import { ThemeProvider, useTheme } from '@/context/Theme';

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
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { status, bootError, retryBoot, forgetSession } = useAuth();
  const { colors: c } = useTheme();

  if (status === 'loading') {
    return (
      <View style={[styles.gate, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={[styles.gate, { backgroundColor: c.bg }]}>
        <Text style={[styles.errorTitle, { color: c.text }]}>Can’t reach your account</Text>
        <Text style={[styles.errorBody, { color: c.textSecondary }]}>{bootError}</Text>
        <Pressable style={[styles.retry, { backgroundColor: c.accent }]} onPress={retryBoot}>
          <Text style={[styles.retryText, { color: c.bg }]}>Try again</Text>
        </Pressable>
        <Pressable onPress={forgetSession}>
          <Text style={[styles.link, { color: c.accent }]}>Use a different account</Text>
        </Pressable>
      </View>
    );
  }

  const signedIn = status === 'signedIn';
  const stack = (
    <View style={[styles.app, { backgroundColor: c.bg }]}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bgElevated },
          headerTintColor: c.accent,
          headerTitleStyle: {
            fontFamily: 'DMSans_600SemiBold',
            color: c.text,
          },
          contentStyle: { backgroundColor: c.bg },
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
          <Stack.Screen name="lists" options={{ title: 'Lists' }} />
          <Stack.Screen name="user/[username]" options={{ title: 'Profile' }} />
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
  app: { flex: 1 },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: { ...typography.title, textAlign: 'center' },
  errorBody: { ...typography.body, textAlign: 'center' },
  retry: {
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { ...typography.bodyBold },
  link: { ...typography.body },
});
