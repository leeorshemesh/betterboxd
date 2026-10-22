import type { MediaItem } from '@/types';

/** In-memory cache so sync UI (timeline, feed) can resolve API-fetched items. */
const cache = new Map<string, MediaItem>();

export function cacheMediaItems(items: MediaItem[]): void {
  for (const item of items) {
    cache.set(item.id, item);
  }
}

export function cacheMediaItem(item: MediaItem): MediaItem {
  cache.set(item.id, item);
  return item;
}

export function getCachedMedia(id: string): MediaItem | undefined {
  return cache.get(id);
}

export function clearMediaCache(): void {
  cache.clear();
}
