import { Image } from 'expo-image';
import { Camera, Plus } from 'phosphor-react-native';
import {
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionHeading } from '@/components/round-detail/SectionHeading';
import { useToast } from '@/components/Toast';
import { getDb } from '@/core/db/database';
import { listPhotosForRound, updateCaption } from '@/core/db/repositories/roundPhotos';
import type { RoundPhoto } from '@/core/db/types';
import {
  attachPhotoFromSource,
  deletePhoto,
  MAX_PHOTOS_PER_ROUND,
} from '@/services/photoStorage';
import { DIVIDER, MASTERS_GREEN, MUTED_TEXT } from '@/theme/colors';

const THUMB = 88;

interface PhotosSectionProps {
  roundId: number;
  /** Hide the section heading entirely (used inline on the summary screen). */
  hideHeading?: boolean;
  onChange?: () => void;
}

export function PhotosSection({
  roundId,
  hideHeading,
  onChange,
}: PhotosSectionProps): JSX.Element {
  const toast = useToast();
  const [refreshNonce, setRefreshNonce] = useState(0);
  const photos = useMemo(() => {
    void refreshNonce;
    return listPhotosForRound(getDb(), roundId);
  }, [refreshNonce, roundId]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const refresh = useCallback((): void => {
    setRefreshNonce((n) => n + 1);
    onChange?.();
  }, [onChange]);

  const onAdd = useCallback(async (source: 'library' | 'camera') => {
    const result = await attachPhotoFromSource(roundId, source);
    if (result.success) {
      refresh();
      return;
    }
    if (result.reason === 'limit-reached') {
      toast.show('Three photos per round.');
    } else if (result.reason === 'permission-denied') {
      toast.show('Permission denied.');
    } else if (result.reason === 'copy-failed') {
      toast.show("Couldn't save that photo.");
    }
  }, [roundId, refresh, toast]);

  const presentAddSheet = useCallback(() => {
    if (photos.length >= MAX_PHOTOS_PER_ROUND) {
      toast.show('Three photos per round.');
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Choose from library'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) void onAdd('camera');
          if (idx === 2) void onAdd('library');
        },
      );
    } else {
      // Android: lightweight alert as a fallback.
      Alert.alert('Add photo', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take photo', onPress: () => void onAdd('camera') },
        { text: 'Choose from library', onPress: () => void onAdd('library') },
      ]);
    }
  }, [onAdd, photos.length, toast]);

  return (
    <View>
      {hideHeading === true ? null : <SectionHeading label="Photos" />}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 4 }}
      >
        {photos.map((p, i) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => setOpenIdx(i)}
            style={({ pressed }) => ({
              width: THUMB,
              height: THUMB,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Image
              source={{ uri: p.file_uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={120}
            />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={presentAddSheet}
          disabled={photos.length >= MAX_PHOTOS_PER_ROUND}
          style={({ pressed }) => ({
            width: THUMB,
            height: THUMB,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: DIVIDER,
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            opacity:
              photos.length >= MAX_PHOTOS_PER_ROUND ? 0.4 : pressed ? 0.7 : 1,
          })}
        >
          {photos.length === 0 ? (
            <Camera size={22} color={MASTERS_GREEN} weight="duotone" />
          ) : (
            <Plus size={20} color={MASTERS_GREEN} weight="bold" />
          )}
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 10,
              color: MUTED_TEXT,
              marginTop: 4,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            {photos.length === 0
              ? 'Add photos'
              : photos.length >= MAX_PHOTOS_PER_ROUND
                ? '3 of 3'
                : `${photos.length} of ${MAX_PHOTOS_PER_ROUND}`}
          </Text>
        </Pressable>
      </ScrollView>

      {openIdx !== null ? (
        <PhotoViewer
          photos={photos}
          startIndex={openIdx}
          onClose={() => setOpenIdx(null)}
          onChanged={refresh}
        />
      ) : null}
    </View>
  );
}

interface PhotoViewerProps {
  photos: RoundPhoto[];
  startIndex: number;
  onClose: () => void;
  onChanged: () => void;
}

function PhotoViewer({
  photos,
  startIndex,
  onClose,
  onChanged,
}: PhotoViewerProps): JSX.Element {
  const [index, setIndex] = useState(startIndex);
  const photo = photos[index] ?? photos[0];
  const [caption, setCaption] = useState<string>(photo?.caption ?? '');
  const [editing, setEditing] = useState(false);

  // Reset editor state when switching photos.
  useEffect(() => {
    setCaption(photo?.caption ?? '');
    setEditing(false);
  }, [photo]);

  const scale = useSharedValue(1);
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((e) => {
          scale.value = Math.max(1, Math.min(4, e.scale));
        })
        .onEnd(() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 180 });
        }),
    [scale],
  );
  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const saveCaption = useCallback(() => {
    if (photo === undefined) return;
    const trimmed = caption.trim();
    updateCaption(getDb(), photo.id, trimmed === '' ? null : trimmed);
    setEditing(false);
    onChanged();
  }, [caption, photo, onChanged]);

  const askDelete = useCallback(() => {
    if (photo === undefined) return;
    Alert.alert('Delete this photo?', "It can't be recovered.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deletePhoto(photo.id, photo.file_uri).then(() => {
            onChanged();
            onClose();
          });
        },
      },
    ]);
  }, [photo, onChanged, onClose]);

  if (photo === undefined) {
    return (
      <Modal visible transparent onRequestClose={onClose} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'black' }} />
      </Modal>
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top', 'bottom']}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
        >
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
            <Text style={{ color: 'white', fontFamily: 'Inter_500Medium', fontSize: 14 }}>
              Close
            </Text>
          </Pressable>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
            }}
          >
            {`${index + 1} / ${photos.length}`}
          </Text>
          <Pressable accessibilityRole="button" onPress={askDelete} hitSlop={10}>
            <Text style={{ color: '#FCA5A5', fontFamily: 'Inter_500Medium', fontSize: 14 }}>
              Delete
            </Text>
          </Pressable>
        </View>

        <GestureDetector gesture={pinch}>
          <Animated.View style={[{ flex: 1 }, imgStyle]}>
            <Image
              source={{ uri: photo.file_uri }}
              style={{ flex: 1 }}
              contentFit="contain"
              transition={120}
            />
          </Animated.View>
        </GestureDetector>

        {photos.length > 1 ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
            }}
          >
            {photos.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setIndex(i)}
                hitSlop={6}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === index ? 'white' : 'rgba(255, 255, 255, 0.3)',
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          {editing ? (
            <TextInput
              value={caption}
              onChangeText={setCaption}
              autoFocus
              multiline
              onBlur={saveCaption}
              placeholder="Add a caption…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={{
                fontFamily: 'Fraunces_500Medium',
                fontSize: 16,
                lineHeight: 22,
                color: 'white',
                minHeight: 40,
              }}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditing(true)}
              hitSlop={10}
            >
              <Text
                style={{
                  fontFamily: caption === '' ? 'Inter_400Regular' : 'Fraunces_500Medium',
                  fontStyle: caption === '' ? 'italic' : 'normal',
                  fontSize: 15,
                  lineHeight: 22,
                  color: caption === '' ? 'rgba(255,255,255,0.5)' : 'white',
                }}
              >
                {caption === '' ? 'Tap to add a caption' : caption}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

