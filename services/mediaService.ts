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

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const at = new Set(a.split(' ').filter(Boolean));
  const bt = b.split(' ').filter(Boolean);
  if (at.size === 0 || bt.length === 0) return 0;
  let hits = 0;
  for (const token of bt) {
    if (at.has(token)) hits += 1;
  }
  return hits / Math.max(at.size, bt.length);
}

/** Prefer exact / prefix / token matches, then popularity, then provider order. */
export function rankAndDedupe(items: MediaItem[], query = ''): MediaItem[] {
  const qRaw = query.trim().toLowerCase();
  const q = normalizeTitle(query);
  const seen = new Set<string>();
  const unique: Array<MediaItem & { __index: number }> = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push({ ...item, __index: i });
  }

  if (!q) {
    return unique
      .sort((a, b) => {
        const pop = (b.popularity ?? 0) - (a.popularity ?? 0);
        if (pop !== 0) return pop;
        return a.__index - b.__index;
      })
      .map(({ __index: _i, ...item }) => item);
  }

  const score = (item: MediaItem): number => {
    let s = 0;
    const title = normalizeTitle(item.title);
    const subtitle = normalizeTitle(item.subtitle ?? '');
    const artist = normalizeTitle(item.artist ?? '');

    if (title === q) s += 200;
    else if (title.startsWith(q)) s += 120;
    else if (q.startsWith(title) && title.length >= 3) s += 90;
    else if (title.includes(q)) s += 50;
    else s += Math.round(tokenOverlap(title, q) * 40);

    if (artist === q) s += 180;
    else if (artist.startsWith(q)) s += 100;
    else if (artist.includes(q)) s += 40;

    if (subtitle === q) s += 40;
    else if (subtitle.includes(q)) s += 15;

    if (item.type === 'music' && item.musicKind === 'artist') {
      if (title === q || artist === q) s += 80;
      else if (title.startsWith(q) || artist.startsWith(q)) s += 40;
    }

    if (item.imageUrl) s += 6;
    if (item.year) s += 2;
    if (item.genres.length > 0) s += 1;
    if (typeof item.popularity === 'number') {
      s += Math.min(25, Math.round(item.popularity / 8));
    }
    if (item.title.toLowerCase() === qRaw) s += 20;
    return s;
  };

  return unique
    .sort((a, b) => {
      const diff = score(b) - score(a);
      if (Math.abs(diff) > 2) return diff;
      const pop = (b.popularity ?? 0) - (a.popularity ?? 0);
      if (pop !== 0) return pop;
      return a.__index - b.__index;
    })
    .map(({ __index: _i, ...item }) => item);
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

export async function getSeasonEpisodeCount(
  mediaId: string,
  season: number,
): Promise<number | null> {
  const type = inferMediaType(mediaId);
  try {
    const data = await api<{ episodeCount: number }>(
      `/catalog/${type}/${encodeURIComponent(mediaId)}/seasons/${season}`,
    );
    return data.episodeCount;
  } catch {
    return null;
  }
}

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
