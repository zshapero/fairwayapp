import { router } from 'expo-router';
import { type JSX, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDb } from '@/core/db/database';
import { createPlayer, listPlayers, updatePlayer } from '@/core/db/repositories/players';
import {
  sanitizeName,
  validateHandicapInput,
} from '@/core/scoring/inputValidation';
import { ACCENT_GOLD, CREAM, DIVIDER, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

export default function AboutYou(): JSX.Element {
  const existing = listPlayers(getDb())[0] ?? null;
  const [name, setName] = useState<string>(existing?.name ?? '');
  const [handicap, setHandicap] = useState<string>('');
  const [handicapError, setHandicapError] = useState<string>('');

  const onContinue = (): void => {
    // Validate handicap: empty is allowed (skip), otherwise must be in range.
    const handicapResult = validateHandicapInput(handicap);
    if (!handicapResult.ok && handicapResult.message !== '') {
      setHandicapError(handicapResult.message);
      return;
    }
    setHandicapError('');
    const cleanName = sanitizeName(name);
    const finalName = cleanName === '' ? 'You' : cleanName;
    const db = getDb();
    if (existing === null) {
      createPlayer(db, { name: finalName });
    } else if (cleanName !== '' && cleanName !== existing.name) {
      updatePlayer(db, existing.id, { name: cleanName });
    }
    // The handicap value (if provided) is intentionally not persisted yet —
    // the player record doesn't store a manual handicap override; it's
    // computed from snapshots. This is documented in #5's call-outs.
    void handicapResult.value;
    router.push('/onboarding/home-course');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View style={{ flex: 1, paddingHorizontal: 32 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: ACCENT_GOLD,
            marginTop: 24,
          }}
        >
          Step 2 of 3
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 32,
            color: '#0F172A',
            marginTop: 12,
            letterSpacing: -0.5,
          }}
        >
          About you
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            lineHeight: 22,
            color: MUTED_TEXT,
            marginTop: 8,
          }}
        >
          Just a name and an estimated handicap to start. Both are easy to change later.
        </Text>

        <View style={{ marginTop: 32 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
            }}
          >
            Your name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Alex"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 22,
              color: '#0F172A',
              paddingVertical: 8,
              borderBottomWidth: 0.5,
              borderBottomColor: DIVIDER,
              marginTop: 8,
            }}
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
            }}
          >
            Estimated handicap
          </Text>
          <TextInput
            value={handicap}
            onChangeText={(t) => {
              setHandicap(t);
              if (handicapError !== '') setHandicapError('');
            }}
            keyboardType="decimal-pad"
            placeholder="e.g., 14.2 or leave blank"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 22,
              color: '#0F172A',
              paddingVertical: 8,
              borderBottomWidth: 0.5,
              borderBottomColor: handicapError !== '' ? '#A6553D' : DIVIDER,
              marginTop: 8,
            }}
          />
          {handicapError !== '' ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: '#A6553D',
                marginTop: 6,
              }}
            >
              {handicapError}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => ({
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: MASTERS_GREEN,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: 'white' }}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
