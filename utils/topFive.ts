import { getMediaSync } from '@/services/mediaService';
import type { DiaryEntry, MediaItem, MediaType, TopFiveConfig, TopFiveMode, TopFiveSlot } from '@/types';

export const TOP_FIVE_MODES: TopFiveMode[] = ['mixed', 'movie', 'show', 'book', 'music'];

export function emptySlotsByMode(): Record<TopFiveMode, TopFiveSlot[]> {
  return {
    mixed: [],
    movie: [],
    show: [],
    book: [],
    music: [],
  };
}

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
  const slots = config.slotsByMode[config.mode] ?? [];
  return slots
    .map((slot) => {
      const media = mediaForId(slot.mediaId, diary);
      return media ? { ...slot, media } : null;
    })
    .filter((slot): slot is TopFiveSlot & { media: MediaItem } => Boolean(slot))
    .sort((a, b) => a.rank - b.rank)
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

/** Replace one mode's slots; leave other modes untouched. */
export function slotsForModeSave(nextIds: string[]): TopFiveSlot[] {
  return nextIds.slice(0, 5).map((mediaId, index) => ({ mediaId, rank: index + 1 }));
}
