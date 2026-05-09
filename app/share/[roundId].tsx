import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { type JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShareableRoundCard,
  SHARE_CANVAS,
} from '@/components/ShareableRoundCard';
import {
  buildShareData,
  captureAndShare,
  captureAndSaveToPhotos,
  listShareablePhotoUris,
} from '@/services/roundShare';
import { trackEvent } from '@/services/analytics';
import { logError } from '@/services/errorReporting';
import { CREAM, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

const PREVIEW_WIDTH = 320;
const PREVIEW_SCALE = PREVIEW_WIDTH / SHARE_CANVAS.width;
const PREVIEW_HEIGHT = SHARE_CANVAS.height * PREVIEW_SCALE;

export default function ShareRound(): JSX.Element {
  const params = useLocalSearchParams<{ roundId: string }>();
  const roundId = Number.parseInt(params.roundId ?? '', 10);
  const baseData = useMemo(() => {
    if (Number.isNaN(roundId)) return null;
    return buildShareData(roundId);
  }, [roundId]);
  const photoUris = useMemo(
    () => (Number.isNaN(roundId) ? [] : listShareablePhotoUris(roundId)),
    [roundId],
  );
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(
    baseData?.backgroundPhotoUri ?? null,
  );
  const data = useMemo(
    () =>
      baseData === null
        ? null
        : { ...baseData, backgroundPhotoUri: selectedPhotoUri },
    [baseData, selectedPhotoUri],
  );

  const captureRef = useRef<View | null>(null);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);

  useEffect(() => {
    Haptics.selectionAsync().catch(() => {
      /* haptics unavailable — ignore */
    });
  }, []);

  if (data === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM, padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', color: MUTED_TEXT }}>
          That round couldn&apos;t be loaded.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', color: MUTED_TEXT }}>
            Close
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const onShare = async (): Promise<void> => {
    if (busy !== null) return;
    setBusy('share');
    try {
      const result = await captureAndShare(captureRef);
      if (!result.shared) {
        Alert.alert('Sharing unavailable', 'Try Save to Photos instead.');
      } else {
        trackEvent('round_shared', { shareType: 'image' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => undefined,
        );
      }
    } catch (e) {
      logError(e, { scope: 'share.capture' });
      Alert.alert(
        'Could not share',
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setBusy(null);
    }
  };

  const onSaveToPhotos = async (): Promise<void> => {
    if (busy !== null) return;
    Haptics.selectionAsync().catch(() => undefined);
    setBusy('save');
    try {
      const result = await captureAndSaveToPhotos(captureRef);
      if (!result.saved) {
        Alert.alert(
          'Could not save',
          result.reason === 'permission-denied'
            ? 'Photos permission was not granted.'
            : 'Try sharing instead.',
        );
        return;
      }
      trackEvent('round_shared', { shareType: 'image' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      Alert.alert('Saved to Photos');
    } catch (e) {
      logError(e, { scope: 'share.saveToPhotos' });
      Alert.alert(
        'Could not save',
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ presentation: 'modal', headerShown: false }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 20,
              color: '#0F172A',
            }}
          >
            Share this round
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

        <ScrollView contentContainerStyle={{ paddingBottom: 32, alignItems: 'center' }}>
          {photoUris.length >= 2 ? (
            <View style={{ width: '100%', paddingHorizontal: 24, marginTop: 4 }}>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: MUTED_TEXT,
                  marginBottom: 8,
                }}
              >
                Use which photo as background?
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedPhotoUri(null)}
                  style={({ pressed }) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.04)',
                    borderWidth: selectedPhotoUri === null ? 2 : 0,
                    borderColor: MASTERS_GREEN,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 10,
                      color: MUTED_TEXT,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    None
                  </Text>
                </Pressable>
                {photoUris.map((uri) => (
                  <Pressable
                    key={uri}
                    accessibilityRole="button"
                    onPress={() => setSelectedPhotoUri(uri)}
                    style={({ pressed }) => ({
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      overflow: 'hidden',
                      borderWidth: selectedPhotoUri === uri ? 2 : 0,
                      borderColor: MASTERS_GREEN,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Soft glow + scaled visible preview */}
          <View
            style={{
              marginTop: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: PREVIEW_WIDTH + 80,
                height: PREVIEW_HEIGHT + 80,
                borderRadius: 32,
                backgroundColor: 'rgba(11, 107, 58, 0.08)',
              }}
            />
            <View
              style={{
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                overflow: 'hidden',
                borderRadius: 18,
                shadowColor: '#0F172A',
                shadowOpacity: 0.16,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
              }}
            >
              <View
                style={{
                  width: SHARE_CANVAS.width,
                  height: SHARE_CANVAS.height,
                  transform: [
                    { translateX: -(SHARE_CANVAS.width - PREVIEW_WIDTH) / 2 },
                    { translateY: -(SHARE_CANVAS.height - PREVIEW_HEIGHT) / 2 },
                    { scale: PREVIEW_SCALE },
                  ],
                }}
              >
                <ShareableRoundCard {...data} />
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ marginTop: 28, width: '100%', paddingHorizontal: 24 }}>
            <Pressable
              accessibilityRole="button"
              onPress={onShare}
              disabled={busy !== null}
              style={({ pressed }) => ({
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                backgroundColor: MASTERS_GREEN,
                opacity: pressed || busy !== null ? 0.85 : 1,
              })}
            >
              {busy === 'share' ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 15,
                    color: 'white',
                    letterSpacing: 0.4,
                  }}
                >
                  Share
                </Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onSaveToPhotos}
              disabled={busy !== null}
              style={({ pressed }) => ({
                marginTop: 12,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(15, 23, 42, 0.12)',
                opacity: pressed || busy !== null ? 0.7 : 1,
              })}
            >
              {busy === 'save' ? (
                <ActivityIndicator color={MASTERS_GREEN} />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 15,
                    color: '#0F172A',
                  }}
                >
                  Save to Photos
                </Text>
              )}
            </Pressable>

            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontStyle: 'italic',
                fontSize: 12,
                color: MUTED_TEXT,
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Looks great to your friends, even better with your story behind it.
            </Text>
          </View>
        </ScrollView>

        {/* Off-screen full-resolution card used for capture. Rendered far
            outside the viewport so it doesn't paint on the visible canvas
            but is still laid out at native 1080×1350 dimensions. */}
        <View
          collapsable={false}
          style={{
            position: 'absolute',
            top: -10000,
            left: -10000,
            width: SHARE_CANVAS.width,
            height: SHARE_CANVAS.height,
          }}
        >
          <View
            ref={captureRef}
            collapsable={false}
            style={{
              width: SHARE_CANVAS.width,
              height: SHARE_CANVAS.height,
            }}
          >
            <ShareableRoundCard {...data} />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
