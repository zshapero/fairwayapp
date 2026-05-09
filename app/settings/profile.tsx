import { useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { type JSX, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { getDb } from '@/core/db/database';
import {
  listPlayers,
  updatePlayer,
} from '@/core/db/repositories/players';
import { CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

export default function Profile(): JSX.Element {
  const queryClient = useQueryClient();
  const player = useMemo(() => listPlayers(getDb())[0] ?? null, []);
  const [name, setName] = useState(player?.name ?? '');
  const [handicap, setHandicap] = useState('14.2');

  const save = (): void => {
    if (player === null) return;
    updatePlayer(getDb(), player.id, { name });
    queryClient.invalidateQueries({ queryKey: ['subscription', 'player'] });
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 8,
        }}
      >
        <Link
          href="/settings"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Settings
        </Link>
        <Pressable accessibilityRole="button" onPress={save}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: MASTERS_GREEN,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <SettingsSection label="Profile">
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(15, 23, 42, 0.08)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 0.6,
                color: MUTED_TEXT,
                textTransform: 'uppercase',
              }}
            >
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="rgba(15, 23, 42, 0.45)"
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 18,
                color: '#0F172A',
                marginTop: 6,
              }}
            />
          </View>
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(15, 23, 42, 0.08)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 0.6,
                color: MUTED_TEXT,
                textTransform: 'uppercase',
              }}
            >
              Estimated handicap
            </Text>
            <TextInput
              value={handicap}
              onChangeText={setHandicap}
              keyboardType="decimal-pad"
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 18,
                color: '#0F172A',
                marginTop: 6,
              }}
            />
          </View>
          <SettingsRow
            title="Preferred tee"
            detail="Defaults to course default"
            onPress={() => router.push('/settings')}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
