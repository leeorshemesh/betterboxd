/**
 * Media catalog — all live fetches go through the Betterboxd API `/catalog/*`
 * so TMDB / Spotify secrets never ship in the Expo web or mobile bundle.
 */
import type { MediaItem, MediaType } from '@/types';
import { mockCatalog, getCatalogById as getMockById } from '@/data/mock/catalog';
import { api } from '@/services/api';
import { getCachedMedia } from '@/services/mediaCache';

export type MediaProvider = 'api';

export interface MediaSearchOptions {
  query?: string;
  type?: MediaType;
  genre?: string;
}

export interface MediaService {
  provider: MediaProvider;
  search(options: MediaSearchOptions): Promise<MediaItem[]>;
  getById(id: string): Promise<MediaItem | null>;
  getByType(type: MediaType): Promise<MediaItem[]>;
  listGenres(): Promise<string[]>;
  similar(id: string): Promise<MediaItem[]>;
}

let cachedProviderStatus: { tmdb: boolean; openLibrary: boolean; spotify: boolean } | null = null;

/** Prefer exact title matches, items with art, then stable title order; drop duplicate ids. */
export function rankAndDedupe(items: MediaItem[], query = ''): MediaItem[] {
  const q = query.trim().toLowerCase();
  const seen = new Set<string>();
  const unique: MediaItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }

  const score = (item: MediaItem): number => {
    let s = 0;
    const title = item.title.toLowerCase();
    if (q) {
      if (title === q) s += 100;
      else if (title.startsWith(q)) s += 60;
      else if (title.includes(q)) s += 30;
      if (item.subtitle?.toLowerCase().includes(q)) s += 10;
      if (item.artist?.toLowerCase().includes(q)) s += 10;
    }
    if (item.imageUrl) s += 8;
    if (item.year) s += 2;
    if (item.genres.length > 0) s += 1;
    return s;
  };

  return unique.sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });
}

export function inferMediaType(id: string): MediaType {
  if (id.startsWith('tmdb-show-') || id.startsWith('show-')) return 'show';
  if (id.startsWith('ol-book-') || id.startsWith('book-')) return 'book';
  if (id.startsWith('spotify-') || id.startsWith('music-')) return 'music';
  return 'movie';
}

const apiMediaService: MediaService = {
  provider: 'api',

  async search({ query = '', type, genre }: MediaSearchOptions) {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (type) params.set('type', type);
    if (genre) params.set('genre', genre);
    const qs = params.toString();
    const data = await api<{
      results: MediaItem[];
      providers?: { tmdb: boolean; openLibrary: boolean; spotify: boolean };
    }>(`/catalog/search${qs ? `?${qs}` : ''}`);
    if (data.providers) cachedProviderStatus = data.providers;
    return data.results;
  },

  async getById(id: string) {
    const cached = getCachedMedia(id);
    if (cached) return cached;

    const mock = getMockById(id);
    if (mock) return mock;

    const type = inferMediaType(id);
    try {
      const data = await api<{ item: MediaItem }>(
        `/catalog/${type}/${encodeURIComponent(id)}`,
      );
      return data.item;
    } catch {
      return null;
    }
  },

  async getByType(type: MediaType) {
    return this.search({ query: '', type });
  },

  async listGenres() {
    const data = await api<{ genres: string[] }>('/catalog/genres');
    return data.genres;
  },

  async similar(id: string) {
    const type = inferMediaType(id);
    try {
      const data = await api<{ results: MediaItem[] }>(
        `/catalog/${type}/${encodeURIComponent(id)}/similar`,
      );
      return data.results;
    } catch {
      return [];
    }
  },
};

export const mediaService: MediaService = apiMediaService;

/** Sync helpers for screens that already have mock / cached data in memory. */
export function getMediaSync(id: string): MediaItem | undefined {
  return getCachedMedia(id) ?? mockCatalog.find((m) => m.id === id);
}

export function getAllMediaSync(): MediaItem[] {
  return mockCatalog;
}

export function getMediaProviderStatus() {
  return (
    cachedProviderStatus ?? {
      tmdb: true,
      openLibrary: true,
      spotify: true,
    }
  );
}

export async function refreshMediaProviderStatus() {
  try {
    const data = await api<{
      providers: { tmdb: boolean; openLibrary: boolean; spotify: boolean };
    }>('/catalog/status');
    cachedProviderStatus = data.providers;
  } catch {
    // keep last known / optimistic defaults
  }
  return getMediaProviderStatus();
}
