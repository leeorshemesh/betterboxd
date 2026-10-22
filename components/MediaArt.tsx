import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MediaTypeIcon } from '@/components/MediaTypeIcon';
import { colors, radii, typography } from '@/constants/theme';
import type { MediaItem } from '@/types';

interface MediaArtProps {
  media: Pick<MediaItem, 'title' | 'artColor' | 'type' | 'imageUrl'>;
  size?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
  rounded?: boolean;
}

/** Artwork: remote poster/cover when `imageUrl` is set, otherwise color placeholder. */
export function MediaArt({ media, size = 56, style, rounded = true }: MediaArtProps) {
  const aspect = media.type === 'music' ? 1 : media.type === 'book' ? 0.72 : 0.68;
  const width = size;
  const height = media.type === 'music' ? size : Math.round(size / aspect);
  const radius = rounded ? radii.sm : 0;

  if (media.imageUrl) {
    return (
      <Image
        source={{ uri: media.imageUrl }}
        style={[
          {
            width,
            height,
            borderRadius: radius,
            backgroundColor: media.artColor,
          },
          style as StyleProp<ImageStyle>,
        ]}
        resizeMode="cover"
        accessibilityLabel={media.title}
      />
    );
  }

  return (
    <View
      style={[
        styles.art,
        {
          width,
          height,
          backgroundColor: media.artColor,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <View style={styles.glyph}>
        <MediaTypeIcon type={media.type} size={14} color="rgba(240,242,236,0.45)" />
      </View>
      <Text style={styles.initials} numberOfLines={2}>
        {media.title.slice(0, 18)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    justifyContent: 'flex-end',
    padding: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  glyph: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  initials: {
    ...typography.caption,
    color: 'rgba(240,242,236,0.85)',
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    lineHeight: 12,
  },
});
