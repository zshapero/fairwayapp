import { Link } from 'expo-router';
import type { JSX } from 'react';
import { Text, View } from 'react-native';

export default function Home(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold text-emerald-700">Fairway</Text>
      <View className="absolute bottom-12">
        <Link href="/debug" className="text-sm text-gray-500 underline">
          Debug
        </Link>
      </View>
    </View>
  );
}
