import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { MEDIA_TYPE_LABELS } from '@/constants/theme';
import type { FeedFilter, MediaType, TopFiveMode } from '@/types';

export type MediaTypeIconKey = MediaType | 'all' | 'mixed';

interface MediaTypeIconProps {
  type: MediaTypeIconKey;
  size?: number;
  color: string;
}

/**
 * Shared media-type glyphs for filters and pickers:
 * movie = clapperboard, show = classic TV, book = book, music = note.
 */
export function MediaTypeIcon({ type, size = 18, color }: MediaTypeIconProps) {
  const label =
    type === 'mixed' ? 'Mixed' : (MEDIA_TYPE_LABELS[type] ?? type);

  if (type === 'movie') {
    return (
      <MaterialCommunityIcons
        name="movie-open"
        size={size}
        color={color}
        accessibilityLabel={label}
      />
    );
  }

  if (type === 'show') {
    return (
      <MaterialCommunityIcons
        name="television-classic"
        size={size}
        color={color}
        accessibilityLabel={label}
      />
    );
  }

  const ionName: keyof typeof Ionicons.glyphMap =
    type === 'book'
      ? 'book'
      : type === 'music'
        ? 'musical-note'
        : 'grid-outline'; // all | mixed

  return <Ionicons name={ionName} size={size} color={color} accessibilityLabel={label} />;
}

export function labelForMediaFilter(value: FeedFilter | TopFiveMode): string {
  if (value === 'mixed') return 'Mixed';
  return MEDIA_TYPE_LABELS[value] ?? value;
}
