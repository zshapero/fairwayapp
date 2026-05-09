import { type JSX, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ACCENT_GOLD, DIVIDER, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';
import type { Tee, TeeHole } from '@/core/db/types';

const TEE_DOT_COLORS: Record<string, string> = {
  black: '#111111',
  blue: '#1E60D0',
  white: '#F2F2F2',
  red: '#C9433A',
  gold: '#C9A23A',
  green: MASTERS_GREEN,
};

function dotColorFor(name: string): string {
  return TEE_DOT_COLORS[name.toLowerCase()] ?? MUTED_TEXT;
}

interface TeesPlayedProps {
  tees: { tee: Tee; holes: TeeHole[]; roundsCount: number }[];
  mostPlayedTeeId: number | null;
  delay?: number;
}

export function TeesPlayed({ tees, mostPlayedTeeId, delay = 400 }: TeesPlayedProps): JSX.Element | null {
  const [open, setOpen] = useState<{ tee: Tee; holes: TeeHole[] } | null>(null);
  if (tees.length === 0) return null;
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <View style={{ borderTopWidth: 0.5, borderTopColor: DIVIDER }}>
        {tees.map(({ tee, holes }, i) => {
          const isMostPlayed = tee.id === mostPlayedTeeId;
          return (
            <Pressable
              key={tee.id}
              accessibilityRole="button"
              onPress={() => setOpen({ tee, holes })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: i === tees.length - 1 ? 0 : 0.5,
                borderBottomColor: DIVIDER,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: dotColorFor(tee.tee_name),
                  borderWidth: 1,
                  borderColor: 'rgba(15, 23, 42, 0.2)',
                  marginRight: 12,
                }}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: 'Fraunces_500Medium',
                      fontSize: 16,
                      color: '#0F172A',
                    }}
                  >
                    {tee.tee_name}
                  </Text>
                  {isMostPlayed ? (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: 'rgba(184, 134, 44, 0.15)',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inter_500Medium',
                          fontSize: 9,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                          color: ACCENT_GOLD,
                        }}
                      >
                        Most played
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    color: MUTED_TEXT,
                    marginTop: 2,
                  }}
                >
                  {`Par ${tee.par_total ?? '—'} · ${tee.total_yards ?? '—'} yards`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: 'Fraunces_500Medium',
                    fontSize: 14,
                    color: '#0F172A',
                  }}
                >
                  {`${tee.course_rating.toFixed(1)} / ${tee.slope_rating}`}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 11,
                    color: MUTED_TEXT,
                    marginTop: 2,
                  }}
                >
                  rating · slope
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={open !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(null)}
      >
        <Pressable
          onPress={() => setOpen(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#FAF6EC',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 360,
            }}
          >
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 18,
                color: '#0F172A',
              }}
            >
              {open?.tee.tee_name} Tees
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: MUTED_TEXT,
                marginTop: 4,
              }}
            >
              {open
                ? `${open.tee.course_rating.toFixed(1)} / ${open.tee.slope_rating} · Par ${open.tee.par_total ?? '—'}`
                : ''}
            </Text>
            <ScrollView style={{ marginTop: 16, maxHeight: 320 }}>
              {open?.holes.map((h) => (
                <View
                  key={h.id}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 6,
                    borderBottomWidth: 0.5,
                    borderBottomColor: DIVIDER,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 13,
                      color: MUTED_TEXT,
                      width: 32,
                    }}
                  >
                    {h.hole_number}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Fraunces_500Medium',
                      fontSize: 13,
                      color: '#0F172A',
                      flex: 1,
                    }}
                  >
                    {`Par ${h.par}`}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      color: MUTED_TEXT,
                    }}
                  >
                    {h.yardage !== null ? `${h.yardage}y` : '—'}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setOpen(null)}
              style={{ alignSelf: 'center', marginTop: 16, paddingVertical: 8 }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', color: MASTERS_GREEN }}>
                Close
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}
