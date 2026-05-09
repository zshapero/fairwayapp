import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { type JSX, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';
import { HoleEditor, type HoleEdit } from '@/components/round-edit/HoleEditor';
import {
  adjustedGrossScore,
  scoreDifferential,
  type RoundInput,
} from '@/core/handicap';
import { getDb } from '@/core/db/database';
import { getCourse } from '@/core/db/repositories/courses';
import {
  createHoleScore,
  deleteHoleScoresForRound,
  listHoleScoresForRound,
} from '@/core/db/repositories/holeScores';
import {
  getRound,
  updateRound,
} from '@/core/db/repositories/rounds';
import { getTee, listTeesForCourse } from '@/core/db/repositories/tees';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import { trackEvent } from '@/services/analytics';
import { logError } from '@/services/errorReporting';
import { recomputeSnapshotsFromDate } from '@/services/snapshotRecompute';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';
import type { Tee } from '@/core/db/types';

interface LoadedRound {
  roundId: number;
  playerId: number;
  courseId: number;
  teeId: number;
  playedAtIso: string;
  notes: string;
  holes: HoleEdit[];
  availableTees: Tee[];
  pcc: number;
  courseHandicap: number;
}

function loadEditableRound(roundId: number): LoadedRound | null {
  const db = getDb();
  const round = getRound(db, roundId);
  if (round === null) return null;
  const tee = getTee(db, round.tee_id);
  if (tee === null) return null;
  const teeHoles = listTeeHoles(db, tee.id);
  const holeScores = listHoleScoresForRound(db, round.id);
  const holes: HoleEdit[] = teeHoles.map((th) => {
    const score = holeScores.find((h) => h.hole_number === th.hole_number);
    return {
      holeNumber: th.hole_number,
      par: th.par,
      yardage: th.yardage,
      strokes: score?.strokes ?? th.par,
      putts: score?.putts ?? null,
      fairway_hit: score?.fairway_hit ?? null,
      green_in_regulation: score?.green_in_regulation ?? null,
      penalty_strokes: score?.penalty_strokes ?? null,
      sand_save: score?.sand_save ?? null,
    };
  });
  return {
    roundId: round.id,
    playerId: round.player_id,
    courseId: round.course_id,
    teeId: round.tee_id,
    playedAtIso: round.played_at,
    notes: round.notes ?? '',
    holes,
    availableTees: listTeesForCourse(db, round.course_id),
    pcc: round.pcc,
    courseHandicap: round.course_handicap,
  };
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isoToDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function dateOnlyToIso(dateOnly: string, fallbackIso: string): string {
  if (!ISO_DATE.test(dateOnly)) return fallbackIso;
  // Preserve the original time-of-day from the existing round timestamp.
  const time = fallbackIso.slice(10);
  return `${dateOnly}${time}`;
}

export default function EditRound(): JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const roundId = Number.parseInt(params.id ?? '', 10);
  const queryClient = useQueryClient();
  const toast = useToast();

  const initial = useMemo<LoadedRound | null>(() => {
    if (Number.isNaN(roundId)) return null;
    return loadEditableRound(roundId);
  }, [roundId]);

  const [holes, setHoles] = useState<HoleEdit[]>(initial?.holes ?? []);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [dateOnly, setDateOnly] = useState<string>(
    initial !== null ? isoToDateOnly(initial.playedAtIso) : '',
  );
  const [teeId, setTeeId] = useState<number | null>(initial?.teeId ?? null);
  const [teePickerOpen, setTeePickerOpen] = useState(false);

  if (initial === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', color: MUTED_TEXT }}>
          That round couldn&apos;t be loaded.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', color: MUTED_TEXT }}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const selectedTee =
    initial.availableTees.find((t) => t.id === teeId) ?? null;

  const onSave = (): void => {
    try {
    const db = getDb();
    const targetTee = selectedTee ?? initial.availableTees.find((t) => t.id === initial.teeId);
    if (targetTee === undefined) {
      Alert.alert('No tee', 'Pick a tee before saving.');
      return;
    }
    const playedAtIso = dateOnlyToIso(dateOnly, initial.playedAtIso);

    // Recompute AGS + score differential from the edited holes.
    const roundInput: RoundInput = {
      holeScores: holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        strokes: h.strokes,
        strokeIndex: h.holeNumber, // placeholder; actual stroke index lives on tee_holes
      })),
      courseRating: targetTee.course_rating,
      slopeRating: targetTee.slope_rating,
      pcc: initial.pcc,
      courseHandicap: initial.courseHandicap,
    };
    const ags = adjustedGrossScore(roundInput);
    const sd = scoreDifferential(roundInput);

    updateRound(db, initial.roundId, {
      played_at: playedAtIso,
      notes: notes.trim() === '' ? null : notes,
      adjusted_gross_score: ags,
      score_differential: sd,
    });
    // tee_id needs a direct UPDATE — updateRound's patch interface omits FK.
    if (targetTee.id !== initial.teeId) {
      db.runSync('UPDATE rounds SET tee_id = ? WHERE id = ?', [targetTee.id, initial.roundId]);
    }
    // Replace hole_scores wholesale.
    deleteHoleScoresForRound(db, initial.roundId);
    for (const h of holes) {
      createHoleScore(db, {
        round_id: initial.roundId,
        hole_number: h.holeNumber,
        par: h.par,
        strokes: h.strokes,
        putts: h.putts,
        fairway_hit: h.fairway_hit,
        green_in_regulation: h.green_in_regulation,
        penalty_strokes: h.penalty_strokes,
        sand_save: h.sand_save,
      });
    }

    // Snapshots may have shifted — replay forward from the (possibly new) date,
    // taking the earlier of the old and new timestamps so both eras are covered.
    const earliest =
      playedAtIso < initial.playedAtIso ? playedAtIso : initial.playedAtIso;
    recomputeSnapshotsFromDate(db, initial.playerId, earliest);

    queryClient.invalidateQueries();
    trackEvent('round_edited', {
      numHolesPlayed: holes.length,
      grossScore: ags,
    });
    toast.show('Saved');
    router.back();
    } catch (e) {
      logError(e, { scope: 'rounds.edit' });
      trackEvent('error_caught', {
        errorType: e instanceof Error ? e.name : 'unknown',
        screenName: 'round_edit',
      });
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 8,
        }}
      >
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 24,
            color: '#0F172A',
          }}
        >
          Edit round
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 16,
              color: MUTED_TEXT,
            }}
          >
            ✕
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 96 }}>
        <View>
          {holes.map((h, i) => (
            <HoleEditor
              key={h.holeNumber}
              hole={h}
              onChange={(next) =>
                setHoles((arr) => arr.map((x, j) => (i === j ? next : x)))
              }
            />
          ))}
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
            Notes
          </Text>
          <TextInput
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth remembering?"
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            style={{
              marginTop: 8,
              minHeight: 84,
              fontFamily: 'Fraunces_500Medium',
              fontSize: 15,
              lineHeight: 22,
              color: '#0F172A',
              borderBottomWidth: 0.5,
              borderBottomColor: DIVIDER,
              paddingVertical: 6,
            }}
          />
        </View>

        <View style={{ marginTop: 24, flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: ACCENT_GOLD,
              }}
            >
              Round date
            </Text>
            <TextInput
              value={dateOnly}
              onChangeText={setDateOnly}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              keyboardType="numbers-and-punctuation"
              style={{
                marginTop: 8,
                fontFamily: 'Fraunces_500Medium',
                fontSize: 15,
                color: '#0F172A',
                borderBottomWidth: 0.5,
                borderBottomColor: DIVIDER,
                paddingVertical: 6,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: ACCENT_GOLD,
              }}
            >
              Tee
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTeePickerOpen(true)}
              style={{
                marginTop: 8,
                paddingVertical: 6,
                borderBottomWidth: 0.5,
                borderBottomColor: DIVIDER,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Fraunces_500Medium',
                  fontSize: 15,
                  color: '#0F172A',
                }}
              >
                {selectedTee?.tee_name ?? 'Select…'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 32, gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            style={({ pressed }) => ({
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: MASTERS_GREEN,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: 'white' }}
            >
              Save changes
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 14,
                color: MUTED_TEXT,
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={teePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTeePickerOpen(false)}
      >
        <Pressable
          onPress={() => setTeePickerOpen(false)}
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
              Select tee
            </Text>
            {initial.availableTees.map((t) => {
              const selected = t.id === teeId;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setTeeId(t.id);
                    setTeePickerOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: DIVIDER,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 15,
                      color: selected ? MASTERS_GREEN : '#0F172A',
                    }}
                  >
                    {t.tee_name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 12,
                      color: MUTED_TEXT,
                      marginTop: 2,
                    }}
                  >
                    {`${t.course_rating.toFixed(1)} / ${t.slope_rating} · Par ${t.par_total ?? '—'}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Course label so the user can see which course they're editing. */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingVertical: 8,
          backgroundColor: CREAM,
          borderTopWidth: 0.5,
          borderTopColor: DIVIDER,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontStyle: 'italic',
            fontSize: 12,
            color: MUTED_TEXT,
            textAlign: 'center',
          }}
        >
          {(() => {
            const course = getCourse(getDb(), initial.courseId);
            return course === null
              ? ''
              : course.course_name !== null
                ? `${course.club_name} · ${course.course_name}`
                : course.club_name;
          })()}
        </Text>
      </View>
    </SafeAreaView>
  );
}
