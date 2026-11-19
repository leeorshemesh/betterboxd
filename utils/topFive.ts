import { getMediaSync } from '@/services/mediaService';
import type { DiaryEntry, MediaItem, MediaType, TopFiveConfig, TopFiveMode, TopFiveSlot } from '@/types';

export function mediaTypeForId(
  mediaId: string,
  diary: DiaryEntry[] = [],
): MediaType | undefined {
  return (
    getMediaSync(mediaId)?.type ??
    diary.find((entry) => entry.media.id === mediaId)?.media.type
  );
}

export function mediaForId(
  mediaId: string,
  diary: DiaryEntry[] = [],
): MediaItem | undefined {
  return (
    getMediaSync(mediaId) ??
    diary.find((entry) => entry.media.id === mediaId)?.media
  );
}

/** Slots visible for the active Top Five mode. */
export function slotsForMode(
  config: TopFiveConfig,
  diary: DiaryEntry[] = [],
): Array<TopFiveSlot & { media: MediaItem }> {
  const resolved = config.slots
    .map((slot) => {
      const media = mediaForId(slot.mediaId, diary);
      return media ? { ...slot, media } : null;
    })
    .filter((slot): slot is TopFiveSlot & { media: MediaItem } => Boolean(slot))
    .sort((a, b) => a.rank - b.rank);

  if (config.mode === 'mixed') {
    const seen = new Set<MediaType>();
    const mixed: Array<TopFiveSlot & { media: MediaItem }> = [];
    for (const slot of resolved) {
      if (seen.has(slot.media.type)) continue;
      seen.add(slot.media.type);
      mixed.push(slot);
    }
    return mixed.map((slot, index) => ({ ...slot, rank: index + 1 }));
  }

  return resolved
    .filter((slot) => slot.media.type === config.mode)
    .map((slot, index) => ({ ...slot, rank: index + 1 }));
}

/** Diary titles available to pin for a mode. */
export function candidatesForMode(diary: DiaryEntry[], mode: TopFiveMode): MediaItem[] {
  const seen = new Set<string>();
  const items: MediaItem[] = [];
  for (const entry of diary) {
    if (seen.has(entry.media.id)) continue;
    if (mode !== 'mixed' && entry.media.type !== mode) continue;
    seen.add(entry.media.id);
    items.push(entry.media);
  }
  return items;
}

/**
 * Merge an edited mode list into the full slots array.
 * Typed modes keep other types; mixed replaces the whole showcase set.
 */
export function mergeSlotsForMode(
  existing: TopFiveSlot[],
  mode: TopFiveMode,
  nextIds: string[],
  diary: DiaryEntry[] = [],
): TopFiveSlot[] {
  if (mode === 'mixed') {
    return nextIds.map((mediaId, index) => ({ mediaId, rank: index + 1 }));
  }

  const others = existing.filter((slot) => mediaTypeForId(slot.mediaId, diary) !== mode);
  const typed = nextIds.map((mediaId, index) => ({ mediaId, rank: index + 1 }));
  return [...others, ...typed].map((slot, index) => ({
    mediaId: slot.mediaId,
    rank: index + 1,
  }));
}
