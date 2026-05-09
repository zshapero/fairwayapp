import { useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { Lock } from 'phosphor-react-native';
import { type JSX, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfidencePill } from '@/components/recommendations/ConfidencePill';
import {
  DEMO_RECOMMENDATIONS,
  type Recommendation,
} from '@/components/recommendations/types';
import { EmptyState } from '@/components/recommendations/EmptyState';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { GlassCard } from '@/components/GlassCard';
import { getDb } from '@/core/db/database';
import { hasLoggedRecently, logDrill } from '@/core/db/repositories/drillLog';
import { listPlayers } from '@/core/db/repositories/players';
import { useSubscription } from '@/services/subscription';
import {
  ACCENT_GOLD,
  CREAM,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';

const TEASER_RECOMMENDATION: Recommendation = {
  key: 'demo_three_putt_freq',
  kind: 'opportunity',
  title: 'Three-putt frequency',
  body: 'Three-putts on 11% of greens this month — about double your six-month baseline.',
  suggestion: 'Spend 15 minutes on lag putts from 30+ feet before your next round.',
  confidence: 'high',
};

export default function Recommendations(): JSX.Element {
  const sub = useSubscription();
  if (sub.isPremium) return <PremiumRecommendations />;
  return <TeaserScreen />;
}

function TeaserScreen(): JSX.Element {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(184, 134, 44, 0.12)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: ACCENT_GOLD,
              }}
            >
              Premium feature
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Fraunces_700Bold',
              fontSize: 28,
              color: '#0F172A',
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            Recommendations
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: MUTED_TEXT,
              marginTop: 6,
              textAlign: 'center',
              maxWidth: 280,
            }}
          >
            See exactly what&apos;s working in your game and what to fix.
          </Text>
        </View>

        {/* Locked example card */}
        <View style={{ marginTop: 32, position: 'relative' }}>
          <View style={{ opacity: 0.4 }} pointerEvents="none">
            <GlassCard className="px-0 py-0">
              <View style={{ flexDirection: 'row', paddingVertical: 18, paddingRight: 20 }}>
                <View style={{ width: 3, backgroundColor: MASTERS_GREEN, marginRight: 17 }} />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: MUTED_TEXT,
                      }}
                    >
                      Opportunity
                    </Text>
                    <ConfidencePill confidence={TEASER_RECOMMENDATION.confidence!} />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Fraunces_600SemiBold',
                      fontSize: 18,
                      color: '#0F172A',
                      marginTop: 4,
                    }}
                  >
                    {TEASER_RECOMMENDATION.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      lineHeight: 19,
                      color: '#0F172A',
                      marginTop: 6,
                    }}
                  >
                    {TEASER_RECOMMENDATION.body}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
          {/* Lock overlay */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(184, 134, 44, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={26} color={ACCENT_GOLD} weight="duotone" />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 36 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
            }}
          >
            What you&apos;ll see
          </Text>
          <Text
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 18,
              lineHeight: 26,
              color: '#0F172A',
              marginTop: 8,
            }}
          >
            Twelve patterns watching your game. Tailored to your handicap level.
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 21,
              color: MUTED_TEXT,
              marginTop: 12,
            }}
          >
            Get the full picture of what&apos;s working and what to fix — backed by your
            actual rounds, not generic advice.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/paywall')}
          style={({ pressed }) => ({
            marginTop: 28,
            alignSelf: 'stretch',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: MASTERS_GREEN,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 15,
              color: 'white',
              letterSpacing: 0.4,
            }}
          >
            Try Premium
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PremiumRecommendations(): JSX.Element {
  const queryClient = useQueryClient();
  const player = useMemo(() => listPlayers(getDb())[0] ?? null, []);
  const initialLogged = useMemo(() => {
    if (player === null) return new Set<string>();
    const set = new Set<string>();
    for (const r of DEMO_RECOMMENDATIONS) {
      if (r.kind !== 'opportunity') continue;
      if (hasLoggedRecently(getDb(), player.id, r.key)) {
        set.add(r.key);
      }
    }
    return set;
  }, [player]);
  const [, force] = useState(0);

  const onPracticed = useCallback(
    (key: string) => {
      if (player === null) return;
      logDrill(getDb(), { player_id: player.id, recommendation_key: key });
      initialLogged.add(key);
      queryClient.invalidateQueries({ queryKey: ['drill-log', player.id] });
      force((n) => n + 1);
    },
    [player, queryClient, initialLogged],
  );

  const opportunities = DEMO_RECOMMENDATIONS.filter((r) => r.kind === 'opportunity');
  const otherCards = DEMO_RECOMMENDATIONS.filter((r) => r.kind !== 'opportunity');
  const hasAny = DEMO_RECOMMENDATIONS.length > 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 28,
            color: '#0F172A',
            marginTop: 8,
          }}
        >
          Recommendations
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: MUTED_TEXT,
            marginTop: 6,
          }}
        >
          What we&apos;re seeing across your last 20 rounds.
        </Text>

        {!hasAny ? (
          <EmptyState />
        ) : (
          <>
            <View style={{ marginTop: 20 }}>
              {opportunities.map((r) => (
                <RecommendationCard
                  key={r.key}
                  recommendation={r}
                  practicedToday={initialLogged.has(r.key)}
                  onPracticed={() => onPracticed(r.key)}
                />
              ))}
            </View>
            {otherCards.length > 0 ? (
              <View style={{ marginTop: 24 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 11,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: ACCENT_GOLD,
                    marginBottom: 4,
                  }}
                >
                  Strengths & milestones
                </Text>
                {otherCards.map((r) => (
                  <RecommendationCard
                    key={r.key}
                    recommendation={r}
                    practicedToday={false}
                    onPracticed={() => undefined}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header(): JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
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
        Recommendations
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
}
