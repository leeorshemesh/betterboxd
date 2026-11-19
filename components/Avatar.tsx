import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { typography } from '@/constants/theme';
import { resolveMediaUrl } from '@/services/api';
import type { User } from '@/types';

interface AvatarProps {
  user: Pick<User, 'avatarColor' | 'avatarInitials' | 'avatarUrl'>;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ user, size = 40, style }: AvatarProps) {
  const uri = resolveMediaUrl(user.avatarUrl);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: user.avatarColor,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{user.avatarInitials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(240,242,236,0.15)',
    overflow: 'hidden',
  },
  initials: {
    ...typography.label,
    color: '#F0F2EC',
    letterSpacing: 0.5,
  },
});
