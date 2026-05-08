import { Stack } from 'expo-router';
import type { JSX } from 'react';
import '../global.css';

export default function RootLayout(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
