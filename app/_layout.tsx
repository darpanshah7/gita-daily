import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { getDb } from '@/src/db/schema';
import { SettingsProvider, useSettings } from '@/src/hooks/useSettings';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();
  const effective = settings.theme === 'system' ? systemScheme : settings.theme;

  useEffect(() => {
    getDb().then(() => {
      SplashScreen.hideAsync();
    }).catch(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <ThemeProvider value={effective === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="verse/[chapter]/[verse]" options={{ headerShown: false }} />
        <Stack.Screen name="chapter/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
