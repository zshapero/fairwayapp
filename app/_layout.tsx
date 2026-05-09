import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { type JSX, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '@/components/Toast';
import { getDb } from '@/core/db/database';
import { seedDevContent } from '@/core/db/devSeed';
import { queryClient } from '@/core/db/queryClient';
import { listPlayers } from '@/core/db/repositories/players';
import '../global.css';

export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  const [seedReady, setSeedReady] = useState(false);

  useEffect(() => {
    try {
      seedDevContent(getDb());
    } catch {
      // DB seed failures shouldn't block the app — UI can render empty states.
    } finally {
      setSeedReady(true);
    }
  }, []);

  // After the layout mounts, route to onboarding if no player has completed
  // it yet. expo-router's router.replace is safe to call inside an effect
  // once the navigator is mounted.
  useEffect(() => {
    if (!seedReady) return;
    try {
      const player = listPlayers(getDb())[0];
      if (player === undefined || player.onboarded === 0) {
        router.replace('/onboarding/welcome');
      }
    } catch {
      // Ignore — the user can still use the app.
    }
  }, [seedReady]);

  if (!fontsLoaded || !seedReady) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </ToastProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
