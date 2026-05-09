import * as Haptics from 'expo-haptics';
import type { JSX } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MUTED_TEXT } from '@/theme/colors';

interface RoundActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  delay?: number;
}

export function RoundActions({
  onEdit,
  onDelete,
  delay = 700,
}: RoundActionsProps): JSX.Element {
  const askDelete = (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {
      /* haptics unavailable — ignore */
    });
    Alert.alert('Delete this round? This cannot be undone.', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(delay)}
      style={{
        marginTop: 80,
        marginBottom: 64,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
      }}
    >
      <Pressable accessibilityRole="button" onPress={onEdit}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MUTED_TEXT,
          }}
        >
          Edit round
        </Text>
      </Pressable>
      <View style={{ width: 1, backgroundColor: 'rgba(15, 23, 42, 0.08)' }} />
      <Pressable accessibilityRole="button" onPress={askDelete}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MUTED_TEXT,
          }}
        >
          Delete round
        </Text>
      </Pressable>
    </Animated.View>
  );
}
