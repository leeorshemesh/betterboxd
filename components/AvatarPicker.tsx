import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '@/components/Avatar';
import { colors, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/services/api';

interface AvatarPickerProps {
  size?: number;
  showHint?: boolean;
}

export function AvatarPicker({ size = 72, showHint = true }: AvatarPickerProps) {
  const { currentUser, uploadAvatar, removeAvatar } = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = async (fromCamera: boolean) => {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo permission is required to update your picture.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });

    if (result.canceled || !result.assets[0]) return;

    setBusy(true);
    try {
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      const form = new FormData();
      const filename = 'avatar.jpg';
      if (Platform.OS === 'web') {
        const response = await fetch(manipulated.uri);
        const blob = await response.blob();
        form.append('file', blob, filename);
      } else {
        form.append('file', {
          uri: manipulated.uri,
          name: filename,
          type: 'image/jpeg',
        } as unknown as Blob);
      }
      await uploadAvatar(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update photo');
    } finally {
      setBusy(false);
    }
  };

  const onPress = () => {
    const buttons: Array<{
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }> = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose photo',
        onPress: () => void pickAndUpload(false),
      },
    ];
    if (Platform.OS !== 'web') {
      buttons.splice(1, 0, {
        text: 'Take photo',
        onPress: () => void pickAndUpload(true),
      });
    }
    if (currentUser.avatarUrl) {
      buttons.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void removeAvatar()
            .catch((err: unknown) => {
              setError(err instanceof ApiError ? err.message : 'Could not remove photo');
            })
            .finally(() => setBusy(false));
        },
      });
    }
    Alert.alert('Profile photo', 'Update the picture people see on your profile.', buttons);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityLabel="Change profile photo"
        style={styles.press}
      >
        <Avatar user={currentUser} size={size} />
        <View style={styles.badge}>
          <Ionicons name="camera" size={14} color={colors.bg} />
        </View>
      </Pressable>
      {showHint ? (
        <Text style={styles.hint}>{busy ? 'Uploading…' : 'Tap to change photo'}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  press: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  error: {
    ...typography.caption,
    color: colors.coral,
  },
});
