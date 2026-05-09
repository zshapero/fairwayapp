import * as Haptics from 'expo-haptics';
import { type JSX, useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MASTERS_GREEN } from '@/theme/colors';
import { SectionHeading } from './SectionHeading';

interface NotesSectionProps {
  initialValue: string | null;
  /** Called when the user blurs the field; the value may be empty. */
  onSave: (value: string) => void;
  delay?: number;
}

/**
 * Journal-style notes field. Generous line-height, italic Fraunces
 * placeholder, saves on blur.  Briefly glows in primary green when a save
 * fires.
 */
export function NotesSection({
  initialValue,
  onSave,
  delay = 500,
}: NotesSectionProps): JSX.Element {
  const [value, setValue] = useState(initialValue ?? '');
  const glow = useSharedValue(0);

  // Sync if the upstream value changes (e.g., screen revisit).
  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  const triggerGlow = useCallback(() => {
    glow.value = withTiming(1, { duration: 180 }, () => {
      glow.value = withTiming(0, { duration: 320 });
    });
  }, [glow]);

  const handleBlur = useCallback(() => {
    if ((value ?? '') === (initialValue ?? '')) return;
    onSave(value);
    triggerGlow();
    Haptics.selectionAsync().catch(() => {
      /* haptics unavailable on simulator — ignore */
    });
  }, [value, initialValue, onSave, triggerGlow]);

  const glowStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(11, 107, 58, ${glow.value * 0.05})`,
  }));

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)}>
      <SectionHeading label="Notes" />
      <Animated.View style={[{ borderRadius: 8, marginTop: 12 }, glowStyle]}>
        <TextInput
          value={value}
          onChangeText={setValue}
          onBlur={handleBlur}
          multiline
          placeholder="Write a note about this round..."
          placeholderTextColor="rgba(15, 23, 42, 0.45)"
          style={{
            fontFamily: value === '' ? 'Fraunces_500Medium' : 'Fraunces_500Medium',
            fontStyle: value === '' ? 'italic' : 'normal',
            fontSize: 16,
            lineHeight: 28,
            color: '#0F172A',
            paddingVertical: 8,
            minHeight: 100,
          }}
        />
        {/* Subtle ring shown only while glowing — pure cosmetic. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 8,
            borderColor: MASTERS_GREEN,
            borderWidth: 0,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}
