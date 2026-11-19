import {
  allGenres,
  getCatalogById,
  searchCatalog,
} from './mockCatalog.js';
import { openLibraryGetById, openLibrarySearch } from './openLibrary.js';
import { rankAndDedupe, rankAndInterleaveByType } from './rank.js';
import {
  isSpotifyConfigured,
  spotifyGetById,
  spotifySearch,
} from './spotify.js';
import {
  isTmdbConfigured,
  parseTmdbId,
  tmdbGetById,
  tmdbListGenres,
  tmdbSearch,
  tmdbSeasonEpisodeCount,
  tmdbSimilar,
} from './tmdb.js';
import type { MediaItem, MediaType } from './types.js';

export interface CatalogSearchOptions {
  query?: string;
  type?: MediaType;
  genre?: string;
}

export { rankAndDedupe } from './rank.js';

function applyGenreFilter(items: MediaItem[], genre?: string): MediaItem[] {
  if (!genre) return items;
  const g = genre.toLowerCase();
  return items.filter((m) => m.genres.some((x) => x.toLowerCase().includes(g)));
}

async function searchMoviesShows(
  query: string,
  type?: MediaType,
  genre?: string,
): Promise<MediaItem[]> {
  if (!isTmdbConfigured()) {
    return applyGenreFilter(
      searchCatalog(query, type === 'show' ? 'show' : type === 'movie' ? 'movie' : undefined).filter(
        (m) => m.type === 'movie' || m.type === 'show',
      ),
      genre,
    );
  }
  try {
    return await tmdbSearch(query, type, genre);
  } catch (e) {
    console.warn('TMDB search failed, using mock', e);
    return applyGenreFilter(
      searchCatalog(query, type).filter((m) => m.type === 'movie' || m.type === 'show'),
      genre,
    );
  }
}

async function searchBooks(query: string, genre?: string): Promise<MediaItem[]> {
  try {
    return applyGenreFilter(await openLibrarySearch(query), genre);
  } catch (e) {
    console.warn('Open Library search failed, using mock', e);
    return applyGenreFilter(searchCatalog(query, 'book'), genre);
  }
}

async function searchMusic(query: string, genre?: string): Promise<MediaItem[]> {
  if (!isSpotifyConfigured()) {
    return applyGenreFilter(searchCatalog(query, 'music'), genre);
  }
  try {
    return applyGenreFilter(await spotifySearch(query), genre);
  } catch (e) {
    console.warn('Spotify search failed, using mock', e);
    return applyGenreFilter(searchCatalog(query, 'music'), genre);
  }
}

export async function catalogSearch(options: CatalogSearchOptions): Promise<MediaItem[]> {
  const { query = '', type, genre } = options;
  let results: MediaItem[] = [];

  if (!type) {
    const [film, books, music] = await Promise.all([
      searchMoviesShows(query, undefined, genre),
      searchBooks(query, genre),
      searchMusic(query, genre),
    ]);
    return rankAndInterleaveByType([...film, ...books, ...music], query);
  } else if (type === 'movie' || type === 'show') {
    results = await searchMoviesShows(query, type, genre);
  } else if (type === 'book') {
    results = await searchBooks(query, genre);
  } else if (type === 'music') {
    results = await searchMusic(query, genre);
  }

  return rankAndDedupe(results, query);
}

export async function catalogSeasonEpisodes(
  id: string,
  season: number,
): Promise<{ episodeCount: number } | null> {
  const count = await tmdbSeasonEpisodeCount(id, season);
  if (count == null) return null;
  return { episodeCount: count };
}

export async function catalogGetById(id: string): Promise<MediaItem | null> {
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
}

export async function catalogListGenres(): Promise<string[]> {
  const fromMock = allGenres;
  if (!isTmdbConfigured()) return fromMock;
  try {
    const fromTmdb = await tmdbListGenres();
    return [...new Set([...fromMock, ...fromTmdb])].sort();
  } catch {
    return fromMock;
  }
}

export async function catalogSimilar(id: string): Promise<MediaItem[]> {
  if (parseTmdbId(id) && isTmdbConfigured()) {
    try {
      return await tmdbSimilar(id);
    } catch (e) {
      console.warn('TMDB similar failed', e);
    }
  }
  const seed = (await catalogGetById(id)) ?? getCatalogById(id);
  if (!seed) return [];
  const pool = await catalogSearch({ query: '', type: seed.type, genre: seed.genres[0] });
  return pool.filter((item) => item.id !== id).slice(0, 12);
}

export function catalogProviderStatus() {
  return {
    tmdb: isTmdbConfigured(),
    openLibrary: true,
    spotify: isSpotifyConfigured(),
  };
}
