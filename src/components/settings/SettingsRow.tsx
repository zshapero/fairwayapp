import type { JSX, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DIVIDER, MUTED_TEXT } from '@/theme/colors';

interface SettingsRowProps {
  title: string;
  /** Optional secondary text shown to the right or below. */
  detail?: string;
  /** Replace the default chevron with custom content (e.g., a segmented control). */
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  title,
  detail,
  trailing,
  onPress,
  destructive,
  isLast,
}: SettingsRowProps): JSX.Element {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: isLast === true ? 0 : 0.5,
        borderBottomColor: DIVIDER,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 15,
            color: destructive === true ? '#A6553D' : '#0F172A',
          }}
        >
          {title}
        </Text>
        {detail !== undefined && trailing === undefined ? (
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: MUTED_TEXT,
              marginTop: 2,
            }}
          >
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing !== undefined ? (
        trailing
      ) : onPress !== undefined ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {detail !== undefined ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: MUTED_TEXT,
                marginRight: 6,
              }}
            >
              {detail}
            </Text>
          ) : null}
          <Text style={{ fontFamily: 'Inter_500Medium', color: MUTED_TEXT }}>›</Text>
        </View>
      ) : null}
    </View>
  );
  if (onPress === undefined) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.6 : 1 }}>{content}</View>
      )}
    </Pressable>
  );
}
