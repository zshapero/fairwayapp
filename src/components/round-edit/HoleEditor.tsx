import { type JSX, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ACCENT_GOLD, DIVIDER, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

export interface HoleEdit {
  holeNumber: number;
  par: number;
  yardage: number | null;
  strokes: number;
  putts: number | null;
  fairway_hit: 0 | 1 | null;
  green_in_regulation: 0 | 1 | null;
  penalty_strokes: number | null;
  sand_save: 0 | 1 | null;
}

interface HoleEditorProps {
  hole: HoleEdit;
  onChange: (next: HoleEdit) => void;
}

function Stepper({
  value,
  onChange,
  min = 1,
  max = 15,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}): JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.04)',
        borderRadius: 999,
        paddingHorizontal: 4,
      }}
    >
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 18, color: '#0F172A' }}>
          −
        </Text>
      </Pressable>
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 18,
          color: '#0F172A',
          minWidth: 28,
          textAlign: 'center',
        }}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 18, color: '#0F172A' }}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 0 | 1 | null;
  onChange: (next: 0 | 1 | null) => void;
}): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          color: MUTED_TEXT,
          marginRight: 8,
          flex: 1,
        }}
      >
        {label}
      </Text>
      {(['no', 'yes'] as const).map((opt, i) => {
        const active = (opt === 'yes' && value === 1) || (opt === 'no' && value === 0);
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            onPress={() =>
              onChange(value === (opt === 'yes' ? 1 : 0) ? null : opt === 'yes' ? 1 : 0)
            }
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              marginLeft: i === 0 ? 0 : 6,
              backgroundColor: active
                ? 'rgba(11, 107, 58, 0.12)'
                : 'rgba(15, 23, 42, 0.04)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                color: active ? MASTERS_GREEN : MUTED_TEXT,
              }}
            >
              {opt === 'yes' ? 'Yes' : 'No'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HoleEditor({ hole, onChange }: HoleEditorProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: DIVIDER,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 0.6,
              color: MUTED_TEXT,
              textTransform: 'uppercase',
            }}
          >
            Hole
          </Text>
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 18,
              color: '#0F172A',
              marginTop: 2,
            }}
          >
            {hole.holeNumber}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: MUTED_TEXT,
            }}
          >
            {`Par ${hole.par}${hole.yardage !== null ? ` · ${hole.yardage}y` : ''}`}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setExpanded((e) => !e)}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                color: ACCENT_GOLD,
                marginTop: 2,
              }}
            >
              {expanded ? 'Hide details' : 'More details'}
            </Text>
          </Pressable>
        </View>
        <Stepper
          value={hole.strokes}
          onChange={(n) => onChange({ ...hole, strokes: n })}
        />
      </View>
      {expanded ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: MUTED_TEXT,
                flex: 1,
              }}
            >
              Putts
            </Text>
            <Stepper
              value={hole.putts ?? 0}
              min={0}
              max={9}
              onChange={(n) => onChange({ ...hole, putts: n })}
            />
          </View>
          {hole.par >= 4 ? (
            <Toggle
              label="Fairway hit"
              value={hole.fairway_hit}
              onChange={(v) => onChange({ ...hole, fairway_hit: v })}
            />
          ) : null}
          <Toggle
            label="Green in regulation"
            value={hole.green_in_regulation}
            onChange={(v) => onChange({ ...hole, green_in_regulation: v })}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: MUTED_TEXT,
                flex: 1,
              }}
            >
              Penalty strokes
            </Text>
            <Stepper
              value={hole.penalty_strokes ?? 0}
              min={0}
              max={5}
              onChange={(n) => onChange({ ...hole, penalty_strokes: n })}
            />
          </View>
          <Toggle
            label="Sand save"
            value={hole.sand_save}
            onChange={(v) => onChange({ ...hole, sand_save: v })}
          />
        </View>
      ) : null}
    </View>
  );
}
