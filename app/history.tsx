import { addMonths, format, isToday, subMonths } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import { CaretLeft, CaretRight } from 'phosphor-react-native';
import { type JSX, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import Svg, { Line, Polygon, Rect } from 'react-native-svg';
import {
  buildMonthGrid,
  countRoundsByDay,
  dayKey,
} from '@/core/calendar/grid';
import { getDb } from '@/core/db/database';
import { getCourse, listCourses } from '@/core/db/repositories/courses';
import { listPlayers } from '@/core/db/repositories/players';
import { listRoundsForPlayer } from '@/core/db/repositories/rounds';
import { listTeeHoles } from '@/core/db/repositories/teeHoles';
import { formatToPar } from '@/core/scoring/relativeToPar';
import {
  ACCENT_GOLD,
  CREAM,
  DIVIDER,
  MASTERS_GREEN,
  MUTED_TEXT,
} from '@/theme/colors';
import type { Round } from '@/core/db/types';

type ViewMode = 'calendar' | 'list';

interface HistoryRound {
  id: number;
  date: Date;
  courseId: number;
  courseLabel: string;
  grossScore: number;
  parTotal: number;
}

interface HistoryData {
  rounds: HistoryRound[];
  /** Available course filter chips. */
  courses: { id: number; label: string }[];
}

function loadHistory(): HistoryData {
  const db = getDb();
  const player = listPlayers(db)[0];
  if (player === undefined) return { rounds: [], courses: [] };
  const rawRounds = listRoundsForPlayer(db, player.id);
  const courseCache = new Map<number, string>();
  const parCache = new Map<number, number>();
  const courseIds = new Set<number>();
  const rounds: HistoryRound[] = rawRounds.map((r: Round) => {
    courseIds.add(r.course_id);
    if (!courseCache.has(r.course_id)) {
      const c = getCourse(db, r.course_id);
      const label =
        c !== null
          ? c.course_name !== null
            ? c.club_name
            : c.club_name
          : 'Unknown';
      courseCache.set(r.course_id, label);
    }
    if (!parCache.has(r.tee_id)) {
      const par = listTeeHoles(db, r.tee_id).reduce((s, h) => s + h.par, 0);
      parCache.set(r.tee_id, par === 0 ? 72 : par);
    }
    return {
      id: r.id,
      date: new Date(r.played_at),
      courseId: r.course_id,
      courseLabel: courseCache.get(r.course_id) ?? '',
      grossScore: r.adjusted_gross_score ?? 0,
      parTotal: parCache.get(r.tee_id) ?? 72,
    };
  });
  const courses = listCourses(db)
    .filter((c) => courseIds.has(c.id))
    .map((c) => ({ id: c.id, label: c.club_name }));
  return { rounds, courses };
}

export default function History(): JSX.Element {
  const data = useMemo(() => loadHistory(), []);
  const initialMode: ViewMode = data.rounds.length >= 5 ? 'calendar' : 'list';
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [filterCourseId, setFilterCourseId] = useState<number | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const filtered = useMemo(
    () =>
      filterCourseId === null
        ? data.rounds
        : data.rounds.filter((r) => r.courseId === filterCourseId),
    [data.rounds, filterCourseId],
  );

  const onModeChange = (next: ViewMode): void => {
    Haptics.selectionAsync().catch(() => undefined);
    setMode(next);
  };

  if (data.rounds.length === 0) {
    return <ZeroRoundsState />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
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
          ← Home
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
          History
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontSize: 28,
            color: '#0F172A',
          }}
        >
          Your rounds
        </Text>
        <View style={{ marginTop: 12, alignItems: 'flex-start' }}>
          <SegmentedControl<ViewMode>
            options={[
              { value: 'calendar', label: 'Calendar' },
              { value: 'list', label: 'List' },
            ]}
            value={mode}
            onChange={onModeChange}
          />
        </View>

        <FilterBar
          courses={data.courses}
          selected={filterCourseId}
          onSelect={(id) => {
            Haptics.selectionAsync().catch(() => undefined);
            setFilterCourseId(id);
          }}
          onMore={() => setFilterModalOpen(true)}
        />
      </View>

      {filtered.length === 0 ? (
        <NoMatchState onClear={() => setFilterCourseId(null)} />
      ) : mode === 'calendar' ? (
        <Animated.View
          key="cal"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={{ flex: 1 }}
        >
          <CalendarView rounds={filtered} />
        </Animated.View>
      ) : (
        <Animated.View
          key="list"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={{ flex: 1 }}
        >
          <ListView rounds={filtered} />
        </Animated.View>
      )}

      <Modal
        visible={filterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <Pressable
          onPress={() => setFilterModalOpen(false)}
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
              Filter by course
            </Text>
            <ScrollView style={{ maxHeight: 360, marginTop: 12 }}>
              <FilterRow
                label="All courses"
                selected={filterCourseId === null}
                onPress={() => {
                  setFilterCourseId(null);
                  setFilterModalOpen(false);
                }}
              />
              {data.courses.map((c) => (
                <FilterRow
                  key={c.id}
                  label={c.label}
                  selected={filterCourseId === c.id}
                  onPress={() => {
                    setFilterCourseId(c.id);
                    setFilterModalOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function FilterRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
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
        {label}
      </Text>
    </Pressable>
  );
}

interface FilterBarProps {
  courses: { id: number; label: string }[];
  selected: number | null;
  onSelect: (id: number | null) => void;
  onMore: () => void;
}

function FilterBar({ courses, selected, onSelect, onMore }: FilterBarProps): JSX.Element {
  const visible = courses.slice(0, 4);
  const hasMore = courses.length > 4;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
    >
      <FilterChip label="All courses" selected={selected === null} onPress={() => onSelect(null)} />
      {visible.map((c) => (
        <FilterChip
          key={c.id}
          label={c.label}
          selected={selected === c.id}
          onPress={() => onSelect(c.id)}
        />
      ))}
      {hasMore ? <FilterChip label="+ More" selected={false} onPress={onMore} /> : null}
    </ScrollView>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: selected
          ? 'rgba(11, 107, 58, 0.12)'
          : 'rgba(15, 23, 42, 0.04)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          color: selected ? MASTERS_GREEN : MUTED_TEXT,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CalendarView({ rounds }: { rounds: HistoryRound[] }): JSX.Element {
  const [cursor, setCursor] = useState(new Date());
  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const counts = useMemo(
    () => countRoundsByDay(rounds.map((r) => ({ played_at: r.date.toISOString() }))),
    [rounds],
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedRounds = useMemo(() => {
    if (selectedKey === null) return [];
    return rounds.filter((r) => dayKey(r.date) === selectedKey);
  }, [rounds, selectedKey]);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setCursor((c) => subMonths(c, 1))}
        >
          <CaretLeft size={20} color={MUTED_TEXT} weight="duotone" />
        </Pressable>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 22,
            color: '#0F172A',
          }}
        >
          {format(cursor, 'MMMM yyyy')}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setCursor((c) => addMonths(c, 1))}
        >
          <CaretRight size={20} color={MUTED_TEXT} weight="duotone" />
        </Pressable>
      </View>

      {/* Day-of-week header */}
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text
            key={`dow-${i}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 0.6,
              color: MUTED_TEXT,
              textTransform: 'uppercase',
            }}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {grid.map((cell) => {
          const k = dayKey(cell.date);
          const count = counts.get(k) ?? 0;
          const isSelected = selectedKey === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              disabled={count === 0}
              onPress={() => {
                if (count === 0) return;
                Haptics.selectionAsync().catch(() => undefined);
                setSelectedKey(k);
              }}
              style={{
                width: `${100 / 7}%`,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isToday(cell.date) ? 1.5 : 0,
                  borderColor: MASTERS_GREEN,
                  backgroundColor: isSelected
                    ? 'rgba(11, 107, 58, 0.12)'
                    : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 13,
                    color: cell.inMonth
                      ? '#0F172A'
                      : 'rgba(15, 23, 42, 0.25)',
                  }}
                >
                  {cell.date.getDate()}
                </Text>
              </View>
              {count === 1 ? (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: MASTERS_GREEN,
                    marginTop: 2,
                  }}
                />
              ) : count > 1 ? (
                <View
                  style={{
                    paddingHorizontal: 6,
                    borderRadius: 999,
                    backgroundColor: 'rgba(184, 134, 44, 0.18)',
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 9,
                      color: ACCENT_GOLD,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {selectedRounds.length > 0 ? (
        <View
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTopWidth: 0.5,
            borderTopColor: DIVIDER,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ACCENT_GOLD,
            }}
          >
            {selectedKey !== null
              ? `${selectedRounds.length} round${selectedRounds.length === 1 ? '' : 's'} on ${format(selectedRounds[0].date, 'MMM d')}`
              : 'Rounds'}
          </Text>
          {selectedRounds.map((r) => (
            <RoundLine key={r.id} round={r} showCourse />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

interface ListSection {
  title: string;
  data: HistoryRound[];
}

function ListView({ rounds }: { rounds: HistoryRound[] }): JSX.Element {
  const sections = useMemo<ListSection[]>(() => {
    const groups = new Map<string, HistoryRound[]>();
    for (const r of rounds) {
      const key = format(r.date, 'yyyy-MM');
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, rs]) => ({
        title: format(rs[0].date, 'MMMM yyyy'),
        data: rs.sort((a, b) => b.date.getTime() - a.date.getTime()),
      }));
  }, [rounds]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      renderSectionHeader={({ section }) => (
        <View
          style={{
            backgroundColor: CREAM,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 18,
              color: '#0F172A',
            }}
          >
            {section.title}
          </Text>
          <View
            style={{
              marginTop: 6,
              height: 0.5,
              backgroundColor: DIVIDER,
            }}
          />
        </View>
      )}
      renderItem={({ item }) => <RoundLine round={item} showCourse />}
      SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

function RoundLine({
  round,
  showCourse,
}: {
  round: HistoryRound;
  showCourse?: boolean;
}): JSX.Element {
  const diff = round.grossScore - round.parTotal;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/rounds/${round.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 56 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            letterSpacing: 0.6,
            color: MUTED_TEXT,
            textTransform: 'uppercase',
          }}
        >
          {format(round.date, 'EEE')}
        </Text>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 16,
            color: '#0F172A',
            marginTop: 2,
          }}
        >
          {format(round.date, 'd')}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 8 }}>
        {showCourse === true ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Fraunces_500Medium',
              fontSize: 16,
              color: '#0F172A',
            }}
          >
            {round.courseLabel}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 18,
            color: '#0F172A',
          }}
        >
          {round.grossScore}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            color: MUTED_TEXT,
            marginTop: 1,
          }}
        >
          {formatToPar(diff)}
        </Text>
      </View>
      <Text style={{ fontFamily: 'Inter_500Medium', color: MUTED_TEXT }}>›</Text>
    </Pressable>
  );
}

function ZeroRoundsState(): JSX.Element {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
      >
        <Link
          href="/"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Home
        </Link>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Svg width={120} height={140} viewBox="0 0 120 140">
          <Rect x={56} y={120} width={8} height={3} fill={MASTERS_GREEN} opacity={0.4} />
          <Line
            x1={60}
            y1={120}
            x2={60}
            y2={36}
            stroke={MASTERS_GREEN}
            strokeWidth={1.5}
          />
          <Polygon points="60,36 100,46 60,58" fill={ACCENT_GOLD} opacity={0.85} />
        </Svg>
        <Text
          style={{
            fontFamily: 'Fraunces_500Medium',
            fontSize: 18,
            color: '#0F172A',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          No rounds yet.
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: MUTED_TEXT,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          Your history will live here.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/play/summary')}
          style={({ pressed }) => ({
            marginTop: 24,
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 12,
            backgroundColor: MASTERS_GREEN,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: 'white',
            }}
          >
            Start a round
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NoMatchState({ onClear }: { onClear: () => void }): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{
          fontFamily: 'Fraunces_500Medium',
          fontSize: 16,
          color: '#0F172A',
          textAlign: 'center',
        }}
      >
        No rounds match this filter.
      </Text>
      <Pressable onPress={onClear} style={{ marginTop: 12 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: MASTERS_GREEN,
          }}
        >
          Clear filter
        </Text>
      </Pressable>
    </View>
  );
}
