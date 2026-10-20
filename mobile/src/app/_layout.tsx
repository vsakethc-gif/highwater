/**
 * _layout.tsx (root) — runs first when the app opens.
 *   1. Keeps the splash screen up while fonts load and the phone's saved data is read.
 *   2. Plugs the phone into the shared code (installNativePlatform, see src/platform.ts).
 *   3. Fades from the splash screen into the app.
 * Then Expo Router shows either the one-time onboarding or the tabs.
 */
// Import only the five font weights we use (the packages' main files would pull in all of them).
import { PublicSans_400Regular } from '@expo-google-fonts/public-sans/400Regular';
import { PublicSans_500Medium } from '@expo-google-fonts/public-sans/500Medium';
import { PublicSans_600SemiBold } from '@expo-google-fonts/public-sans/600SemiBold';
import { PublicSans_700Bold } from '@expo-google-fonts/public-sans/700Bold';
import { SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4/600SemiBold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router/stack';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installNativePlatform } from '../platform';
import { AppStateProvider } from '../state';
import { dark, light } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 400 });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold, PublicSans_700Bold, SourceSerif4_600SemiBold });
  const [platformReady, setPlatformReady] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    installNativePlatform().finally(() => setPlatformReady(true));
  }, []);

  // If fonts fail to load, carry on with the system font rather than hanging on the splash screen.
  const ready = (fontsLoaded || fontError) && platformReady;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  const bg = scheme === 'dark' ? dark.bg : light.bg;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
