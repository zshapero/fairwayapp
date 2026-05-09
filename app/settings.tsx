import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import { type JSX, useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { clearAllData, getDb } from '@/core/db/database';
import {
  listPlayers,
  updatePlayerPreferences,
} from '@/core/db/repositories/players';
import type { PreferredUnits, TimeFormat } from '@/core/db/types';
import { useSubscription } from '@/services/subscription';
import { CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

function loadPlayer() {
  return listPlayers(getDb())[0] ?? null;
}

export default function Settings(): JSX.Element {
  const queryClient = useQueryClient();
  const sub = useSubscription();
  const player = useMemo(() => loadPlayer(), []);

  const persistPreferences = useCallback(
    (patch: { preferred_units?: PreferredUnits; time_format?: TimeFormat }) => {
      if (player === null) return;
      updatePlayerPreferences(getDb(), player.id, patch);
      queryClient.invalidateQueries({ queryKey: ['subscription', 'player'] });
    },
    [player, queryClient],
  );

  const initial = (player?.name ?? 'Y').charAt(0).toUpperCase();

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
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Back
        </Link>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 13,
            letterSpacing: 0.6,
            color: MUTED_TEXT,
            textTransform: 'uppercase',
          }}
        >
          Settings
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <SettingsSection label="Profile">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings/profile')}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: MASTERS_GREEN,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Fraunces_600SemiBold',
                    fontSize: 24,
                    color: 'white',
                  }}
                >
                  {initial}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'Fraunces_600SemiBold',
                    fontSize: 22,
                    color: '#0F172A',
                  }}
                >
                  {player?.name ?? 'You'}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 13,
                    color: MUTED_TEXT,
                    marginTop: 2,
                  }}
                >
                  Estimated handicap 14.2
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter_500Medium', color: MUTED_TEXT }}>›</Text>
            </View>
          </Pressable>
        </SettingsSection>

        <SettingsSection label="Subscription">
          {sub.isPremium ? (
            <>
              <SettingsRow
                title="Premium plan"
                detail={
                  player?.subscription_expires_at != null
                    ? `Expires ${new Date(
                        player.subscription_expires_at,
                      ).toLocaleDateString()}`
                    : 'Active'
                }
              />
              <SettingsRow
                title="Manage subscription"
                onPress={() =>
                  Alert.alert(
                    'Manage subscription',
                    'Subscriptions are managed in your App Store settings.',
                  )
                }
                isLast
              />
            </>
          ) : (
            <>
              <SettingsRow title="Free plan" detail="Upgrade to unlock everything" />
              <SettingsRow
                title="Get Premium"
                onPress={() => router.push('/paywall')}
                isLast
              />
            </>
          )}
        </SettingsSection>

        <SettingsSection label="Preferences">
          <SettingsRow
            title="Units"
            trailing={
              <SegmentedControl<PreferredUnits>
                options={[
                  { value: 'imperial', label: 'Imperial' },
                  { value: 'metric', label: 'Metric' },
                ]}
                value={player?.preferred_units ?? 'imperial'}
                onChange={(v) => persistPreferences({ preferred_units: v })}
              />
            }
          />
          <SettingsRow
            title="Default tee"
            detail={
              player?.preferred_tee_id !== null && player?.preferred_tee_id !== undefined
                ? `Tee #${player.preferred_tee_id}`
                : 'Not set'
            }
            onPress={() =>
              Alert.alert(
                'Default tee',
                'Choosing a default tee comes with the round entry flow.',
              )
            }
          />
          <SettingsRow
            title="Time format"
            trailing={
              <SegmentedControl<TimeFormat>
                options={[
                  { value: '12h', label: '12h' },
                  { value: '24h', label: '24h' },
                ]}
                value={player?.time_format ?? '12h'}
                onChange={(v) => persistPreferences({ time_format: v })}
              />
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection label="Data">
          <SettingsRow
            title="Export rounds"
            onPress={() =>
              Alert.alert('Export rounds', 'Coming with Premium.')
            }
          />
          <SettingsRow
            title="Clear all data"
            destructive
            onPress={() =>
              Alert.alert(
                'Clear all data?',
                'Every round, course, and snapshot will be removed. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                      clearAllData(getDb());
                      queryClient.invalidateQueries();
                      router.replace('/');
                    },
                  },
                ],
              )
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection label="About">
          <SettingsRow
            title="Send feedback"
            onPress={() => Linking.openURL('mailto:hello@fairway.app')}
          />
          <SettingsRow
            title="Privacy policy"
            onPress={() => Linking.openURL('https://fairway.app/privacy')}
          />
          <SettingsRow
            title="Terms of service"
            onPress={() => Linking.openURL('https://fairway.app/terms')}
            isLast
          />
        </SettingsSection>

        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 10,
            color: MUTED_TEXT,
            textAlign: 'center',
            marginTop: 32,
          }}
        >
          Version 1.0.0 · Build 1
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
