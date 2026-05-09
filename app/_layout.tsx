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
import { Stack } from 'expo-router';
import { type JSX, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDb } from '@/core/db/database';
import { seedDevContent } from '@/core/db/devSeed';
import { queryClient } from '@/core/db/queryClient';
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

  if (!fontsLoaded || !seedReady) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
