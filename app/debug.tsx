import type { JSX } from 'react';
import { Text, View } from 'react-native';

export default function Debug(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-base text-gray-700">Debug screen, coming soon.</Text>
    </View>
  );
}
