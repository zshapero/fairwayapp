import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import {
  ChartLine,
  Export,
  Sparkle,
  Star,
  type IconProps,
} from 'phosphor-react-native';
import type { ComponentType, JSX } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaperTexture } from '@/components/round-detail/PaperTexture';
import { setMockSubscriptionTier } from '@/services/subscription';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';

interface FeatureRow {
  Icon: ComponentType<IconProps>;
  title: string;
  description: string;
}

const FEATURES: FeatureRow[] = [
  {
    Icon: Sparkle,
    title: 'Personal recommendations',
    description: 'Twelve patterns watching your game. Tailored to your handicap level.',
  },
  {
    Icon: ChartLine,
    title: 'Full handicap history',
    description: 'See your trend across years, not just months.',
  },
  {
    Icon: Export,
    title: 'Round export',
    description: 'Export any round as a PDF for your records.',
  },
  {
    Icon: Star,
    title: 'Unlimited courses',
    description: "Save every course you've played.",
  },
];

function Feature({ Icon, title, description }: FeatureRow): JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 18,
          backgroundColor: 'rgba(184, 134, 44, 0.12)',
          marginRight: 14,
        }}
      >
        <Icon size={20} color={ACCENT_GOLD} weight="duotone" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 16,
            color: '#0F172A',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            lineHeight: 18,
            color: MUTED_TEXT,
            marginTop: 2,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

interface PriceButtonProps {
  label: string;
  price: string;
  cadence: string;
  highlighted?: boolean;
  onPress: () => void;
}

function PriceButton({
  label,
  price,
  cadence,
  highlighted,
  onPress,
}: PriceButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: highlighted === true ? MASTERS_GREEN : '#0F172A',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          letterSpacing: 0.6,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 18,
          color: 'white',
          marginTop: 4,
        }}
      >
        {price}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 11,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 2,
        }}
      >
        {cadence}
      </Text>
    </Pressable>
  );
}

export default function Paywall(): JSX.Element {
  const queryClient = useQueryClient();

  const startPurchase = (cadence: 'monthly' | 'yearly'): void => {
    Alert.alert(
      'Subscriptions launching soon.',
      `You'll be the first to know about ${cadence} pricing.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Dev-only stub: flip the tier so we can exercise premium flows.
            setMockSubscriptionTier('premium');
            queryClient.invalidateQueries({ queryKey: ['subscription', 'player'] });
            router.back();
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <PaperTexture width={500} height={1000} opacity={0.025} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable accessibilityRole="button" onPress={() => router.back()}>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: MUTED_TEXT,
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                fontFamily: 'Fraunces_700Bold',
                fontSize: 32,
                color: '#0F172A',
                letterSpacing: -0.5,
              }}
            >
              Premium
            </Text>
            <View
              style={{
                width: 40,
                height: 2,
                backgroundColor: ACCENT_GOLD,
                marginTop: 6,
              }}
            />
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: MUTED_TEXT,
                marginTop: 14,
              }}
            >
              Get the full picture of your game.
            </Text>
          </View>

          <View style={{ marginTop: 28 }}>
            {FEATURES.map((f) => (
              <View key={f.title}>
                <Feature {...f} />
                <View style={{ height: 0.5, backgroundColor: DIVIDER }} />
              </View>
            ))}
          </View>

          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Fraunces_700Bold',
                fontSize: 28,
                color: '#0F172A',
              }}
            >
              $4.99
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: MUTED_TEXT,
                }}
              >
                {' '}
                / month
              </Text>
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 0.6,
                color: MUTED_TEXT,
                textTransform: 'uppercase',
                marginTop: 12,
              }}
            >
              or
            </Text>
            <Text
              style={{
                fontFamily: 'Fraunces_700Bold',
                fontSize: 28,
                color: MASTERS_GREEN,
                marginTop: 6,
              }}
            >
              $39.99
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: MASTERS_GREEN,
                }}
              >
                {' '}
                / year
              </Text>
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 0.6,
                color: MASTERS_GREEN,
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              yearly · save 33%
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
            <PriceButton
              label="Monthly"
              price="$4.99"
              cadence="billed monthly"
              onPress={() => startPurchase('monthly')}
            />
            <PriceButton
              label="Yearly"
              price="$39.99"
              cadence="billed yearly"
              highlighted
              onPress={() => startPurchase('yearly')}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                'Restore purchase',
                'No previous purchase to restore.',
              )
            }
            style={{ marginTop: 20, alignSelf: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MUTED_TEXT,
              }}
            >
              Restore purchase
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 10,
              lineHeight: 14,
              color: MUTED_TEXT,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            Subscriptions auto-renew at the price shown until cancelled in your App
            Store settings at least 24 hours before the end of the current period.
            Premium features remain accessible while a subscription is active.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
