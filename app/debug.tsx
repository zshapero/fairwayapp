import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
  adjustedGrossScore,
  courseHandicap,
  scoreDifferential,
  type HoleScore as EngineHoleScore,
  type RoundInput,
} from '@/core/handicap';
import { clearAllData, getDb } from '@/core/db/database';
import { getSchemaVersion } from '@/core/db/migrations';
import { seedDemoData } from '@/core/db/seed';
import type { Db } from '@/core/db/db';
import { countPlayers } from '@/core/db/repositories/players';
import { countCourses } from '@/core/db/repositories/courses';
import { countTees } from '@/core/db/repositories/tees';
import { countTeeHoles } from '@/core/db/repositories/teeHoles';
import { countRounds } from '@/core/db/repositories/rounds';
import { countHoleScores } from '@/core/db/repositories/holeScores';
import { countHandicapSnapshots } from '@/core/db/repositories/handicapSnapshots';
import { _devTriggerSentryError } from '@/services/errorReporting';

interface Counts {
  players: number;
  courses: number;
  tees: number;
  tee_holes: number;
  rounds: number;
  hole_scores: number;
  handicap_snapshots: number;
}

const ZERO_COUNTS: Counts = {
  players: 0,
  courses: 0,
  tees: 0,
  tee_holes: 0,
  rounds: 0,
  hole_scores: 0,
  handicap_snapshots: 0,
};

function readCounts(db: Db): Counts {
  return {
    players: countPlayers(db),
    courses: countCourses(db),
    tees: countTees(db),
    tee_holes: countTeeHoles(db),
    rounds: countRounds(db),
    hole_scores: countHoleScores(db),
    handicap_snapshots: countHandicapSnapshots(db),
  };
}

interface HandicapTestResult {
  adjustedGrossScore: number;
  scoreDifferential: number;
  courseHandicap: number;
}

function runHandicapDemo(): HandicapTestResult {
  // Sample 18-hole round: par 72, scattered strokes, 1 blow-up hole.
  // HI 14.0 player on a 71.5/130 course, par 72, PCC 0.
  const HOLE_PARS = [4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 4, 3, 4, 5, 4, 4, 3, 5];
  const HOLE_STROKES = [5, 6, 4, 4, 4, 6, 3, 5, 4, 5, 5, 3, 5, 6, 4, 5, 4, 9];
  const holeScores: EngineHoleScore[] = HOLE_PARS.map((par, i) => ({
    holeNumber: i + 1,
    par,
    strokes: HOLE_STROKES[i],
    strokeIndex: i + 1,
  }));
  const ch = courseHandicap(14.0, 130, 71.5, 72);
  const round: RoundInput = {
    holeScores,
    courseRating: 71.5,
    slopeRating: 130,
    pcc: 0,
    courseHandicap: ch,
  };
  return {
    adjustedGrossScore: adjustedGrossScore(round),
    scoreDifferential: scoreDifferential(round),
    courseHandicap: ch,
  };
}

export default function Debug(): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [schemaVersion, setSchemaVersion] = useState<number | null>(null);
  const [counts, setCounts] = useState<Counts>(ZERO_COUNTS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [handicapResult, setHandicapResult] = useState<HandicapTestResult | null>(null);

  const refresh = useCallback(() => {
    try {
      const db = getDb();
      setSchemaVersion(getSchemaVersion(db));
      setCounts(readCounts(db));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSeed = useCallback(() => {
    setBusy(true);
    try {
      const result = seedDemoData(getDb());
      setMessage(
        result.coursesAdded === 0
          ? 'Demo data already present.'
          : `Seeded ${result.coursesAdded} demo course(s).`,
      );
      refresh();
    } catch (e) {
      setMessage(`Seed failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const onClear = useCallback(() => {
    Alert.alert(
      'Clear all data?',
      'This wipes every row from every table. Schema is preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            try {
              clearAllData(getDb());
              setMessage('All tables cleared.');
              refresh();
            } catch (e) {
              setMessage(`Clear failed: ${e instanceof Error ? e.message : String(e)}`);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [refresh]);

  const onRunHandicap = useCallback(() => {
    try {
      setHandicapResult(runHandicapDemo());
    } catch (e) {
      setMessage(`Handicap test failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const status = useMemo(() => (error === null ? 'Connected' : 'Failed'), [error]);
  const statusColor = error === null ? 'text-emerald-600' : 'text-red-600';

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6 pb-12">
      <Link href="/" className="mb-3 text-sm text-gray-500 underline">
        ← Back to home
      </Link>

      <Text className="text-2xl font-bold text-gray-900">Fairway Debug</Text>

      <View className="mt-6 rounded-lg border border-gray-200 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">Database</Text>
        <View className="mt-2 flex-row items-baseline justify-between">
          <Text className="text-base text-gray-700">Status</Text>
          <Text className={`text-base font-semibold ${statusColor}`}>{status}</Text>
        </View>
        <View className="mt-1 flex-row items-baseline justify-between">
          <Text className="text-base text-gray-700">Schema version</Text>
          <Text className="text-base text-gray-900">
            {schemaVersion === null ? '—' : schemaVersion}
          </Text>
        </View>
        {error !== null ? (
          <Text className="mt-2 text-sm text-red-600">{error}</Text>
        ) : null}
      </View>

      <View className="mt-4 rounded-lg border border-gray-200 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">Row counts</Text>
        {(Object.keys(counts) as (keyof Counts)[]).map((table) => (
          <View
            key={table}
            className="mt-2 flex-row items-baseline justify-between"
          >
            <Text className="font-mono text-sm text-gray-700">{table}</Text>
            <Text className="font-mono text-sm text-gray-900">{counts[table]}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 gap-2">
        <DebugButton
          label="Seed demo data"
          onPress={onSeed}
          disabled={busy}
          tone="primary"
        />
        <DebugButton
          label="Clear all data"
          onPress={onClear}
          disabled={busy}
          tone="danger"
        />
        <DebugButton
          label="Run handicap test"
          onPress={onRunHandicap}
          disabled={busy}
          tone="neutral"
        />
        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <DebugButton
            label="Throw test error (Sentry)"
            onPress={() => {
              const id = _devTriggerSentryError();
              setMessage(
                id !== null
                  ? `Sentry captured event ${id}.`
                  : 'No Sentry DSN configured — set EXPO_PUBLIC_SENTRY_DSN.',
              );
            }}
            disabled={busy}
            tone="neutral"
          />
        ) : null}
      </View>

      {message !== null ? (
        <Text className="mt-3 text-sm text-gray-600">{message}</Text>
      ) : null}

      {handicapResult !== null ? (
        <View className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <Text className="text-xs uppercase tracking-wide text-emerald-700">
            Handicap test (HI 14.0, 71.5 / 130, par 72)
          </Text>
          <View className="mt-2 flex-row items-baseline justify-between">
            <Text className="text-sm text-gray-700">Course handicap</Text>
            <Text className="font-mono text-sm text-gray-900">
              {handicapResult.courseHandicap}
            </Text>
          </View>
          <View className="mt-1 flex-row items-baseline justify-between">
            <Text className="text-sm text-gray-700">Adjusted gross score</Text>
            <Text className="font-mono text-sm text-gray-900">
              {handicapResult.adjustedGrossScore}
            </Text>
          </View>
          <View className="mt-1 flex-row items-baseline justify-between">
            <Text className="text-sm text-gray-700">Score differential</Text>
            <Text className="font-mono text-sm text-gray-900">
              {handicapResult.scoreDifferential.toFixed(1)}
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

interface DebugButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone: 'primary' | 'danger' | 'neutral';
}

function DebugButton({ label, onPress, disabled, tone }: DebugButtonProps): JSX.Element {
  const base = 'rounded-lg px-4 py-3 active:opacity-80';
  const palette =
    tone === 'primary'
      ? 'bg-emerald-600'
      : tone === 'danger'
        ? 'bg-red-600'
        : 'bg-gray-700';
  const opacity = disabled === true ? 'opacity-50' : '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${palette} ${opacity}`}
    >
      <Text className="text-center text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
