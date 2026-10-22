/**
 * Media catalog — routes by type:
 *   movie / show → TMDB (EXPO_PUBLIC_TMDB_API_KEY)
 *   book         → Open Library (no key)
 *   music        → Spotify (Client ID + Secret; falls back to mock if secret missing)
 *
 * Mock catalog still used for seeded reviews and as Spotify fallback.
 */
import type { MediaItem, MediaType } from '@/types';
import {
  allGenres,
  getCatalogById,
  getCatalogByType,
  mockCatalog,
  searchCatalog,
} from '@/data/mock/catalog';
import { openLibraryGetById, openLibrarySearch } from '@/services/adapters/openLibrary';
import {
  isSpotifyConfigured,
  spotifyGetById,
  spotifySearch,
} from '@/services/adapters/spotify';
import {
  isTmdbConfigured,
  parseTmdbId,
  tmdbGetById,
  tmdbListGenres,
  tmdbSearch,
} from '@/services/adapters/tmdb';
import { getCachedMedia } from '@/services/mediaCache';

export type MediaProvider = 'mock' | 'tmdb' | 'openlibrary' | 'spotify' | 'composite';

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
}

function applyGenreFilter(items: MediaItem[], genre?: string): MediaItem[] {
  if (!genre) return items;
  const g = genre.toLowerCase();
  return items.filter((m) => m.genres.some((x) => x.toLowerCase().includes(g)));
}

async function searchMoviesShows(query: string, type?: MediaType): Promise<MediaItem[]> {
  if (!isTmdbConfigured()) {
    return searchCatalog(query, type === 'show' ? 'show' : type === 'movie' ? 'movie' : undefined).filter(
      (m) => m.type === 'movie' || m.type === 'show',
    );
  }
  try {
    return await tmdbSearch(query, type);
  } catch (e) {
    console.warn('TMDB search failed, using mock', e);
    return searchCatalog(query, type).filter((m) => m.type === 'movie' || m.type === 'show');
  }
}

async function searchBooks(query: string): Promise<MediaItem[]> {
  try {
    return await openLibrarySearch(query);
  } catch (e) {
    console.warn('Open Library search failed, using mock', e);
    return searchCatalog(query, 'book');
  }
}

async function searchMusic(query: string): Promise<MediaItem[]> {
  if (!isSpotifyConfigured()) {
    return searchCatalog(query, 'music');
  }
  try {
    return await spotifySearch(query);
  } catch (e) {
    console.warn('Spotify search failed, using mock', e);
    return searchCatalog(query, 'music');
  }
}

const compositeMediaService: MediaService = {
  provider: 'composite',

  async search({ query = '', type, genre }: MediaSearchOptions) {
    let results: MediaItem[] = [];

    if (!type) {
      const [film, books, music] = await Promise.all([
        searchMoviesShows(query),
        searchBooks(query),
        searchMusic(query),
      ]);
      results = [...film, ...books, ...music];
    } else if (type === 'movie' || type === 'show') {
      results = await searchMoviesShows(query, type);
    } else if (type === 'book') {
      results = await searchBooks(query);
    } else if (type === 'music') {
      results = await searchMusic(query);
    }

    return applyGenreFilter(results, genre);
  },

  async getById(id: string) {
    const cached = getCachedMedia(id);
    if (cached) return cached;

    const mock = getCatalogById(id);
    if (mock) return mock;

    if (parseTmdbId(id) && isTmdbConfigured()) {
      try {
        return await tmdbGetById(id);
      } catch (e) {
        console.warn('TMDB getById failed', e);
      }
    }

    if (id.startsWith('ol-book-')) {
      try {
        return await openLibraryGetById(id);
      } catch (e) {
        console.warn('Open Library getById failed', e);
      }
    }

    if (id.startsWith('spotify-') && isSpotifyConfigured()) {
      try {
        return await spotifyGetById(id);
      } catch (e) {
        console.warn('Spotify getById failed', e);
      }
    }

    return null;
  },

  async getByType(type: MediaType) {
    return this.search({ query: '', type });
  },

  async listGenres() {
    const fromMock = allGenres;
    if (!isTmdbConfigured()) return fromMock;
    try {
      const fromTmdb = await tmdbListGenres();
      const set = new Set([...fromMock, ...fromTmdb]);
      return [...set].sort();
    } catch {
      return fromMock;
    }
  },
};

export const mediaService: MediaService = compositeMediaService;

/** Sync helpers for screens that already have mock / cached data in memory. */
export function getMediaSync(id: string): MediaItem | undefined {
  return getCachedMedia(id) ?? mockCatalog.find((m) => m.id === id);
}

export function getAllMediaSync(): MediaItem[] {
  return mockCatalog;
}

export function getMediaProviderStatus() {
  return {
    tmdb: isTmdbConfigured(),
    openLibrary: true,
    spotify: isSpotifyConfigured(),
  };
}
