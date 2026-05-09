import { router } from 'expo-router';
import type { JSX } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MUTED_TEXT } from '@/theme/colors';
import { formatToPar } from '@/core/scoring/relativeToPar';

export interface RoundCardData {
  id: number;
  courseName: string;
  playedAt: Date;
  grossScore: number;
  parTotal: number;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatItalicDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function RoundCard({ round }: { round: RoundCardData }): JSX.Element {
  const diff = round.grossScore - round.parTotal;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/rounds/${round.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 18,
            color: '#0F172A',
          }}
          numberOfLines={1}
        >
          {round.courseName}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontStyle: 'italic',
            fontSize: 13,
            color: MUTED_TEXT,
            marginTop: 2,
          }}
        >
          {formatItalicDate(round.playedAt)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 12 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 24,
            color: '#0F172A',
          }}
        >
          {round.grossScore}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 12,
            color: MUTED_TEXT,
            marginLeft: 6,
          }}
        >
          {formatToPar(diff)}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 18,
          color: MUTED_TEXT,
        }}
      >
        ›
      </Text>
    </Pressable>
  );
}
