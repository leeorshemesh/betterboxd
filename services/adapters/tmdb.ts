import type { MediaItem, MediaType } from '@/types';
import { artColorFromId } from '@/services/artColor';
import { cacheMediaItem, cacheMediaItems } from '@/services/mediaCache';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w342';

type TmdbMovie = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
};

type TmdbTvDetail = TmdbMovie & {
  number_of_seasons?: number;
  number_of_episodes?: number;
};

const GENRE_MOVIE: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const GENRE_TV: Record<number, string> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

function apiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_TMDB_API_KEY || undefined;
}

export function isTmdbConfigured(): boolean {
  return Boolean(apiKey());
}

export function parseTmdbId(id: string): { kind: 'movie' | 'show'; tmdbId: number } | null {
  const m = /^tmdb-(movie|show)-(\d+)$/.exec(id);
  if (!m) return null;
  return { kind: m[1] as 'movie' | 'show', tmdbId: Number(m[2]) };
}

function yearFromDate(date?: string): number | undefined {
  if (!date || date.length < 4) return undefined;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

function mapGenres(ids: number[] | undefined, kind: 'movie' | 'show', named?: { name: string }[]): string[] {
  if (named?.length) return named.map((g) => g.name);
  const table = kind === 'movie' ? GENRE_MOVIE : GENRE_TV;
  return (ids ?? []).map((id) => table[id]).filter(Boolean) as string[];
}

function toMediaItem(row: TmdbMovie, kind: 'movie' | 'show', extra?: Partial<MediaItem>): MediaItem {
  const title = (kind === 'movie' ? row.title : row.name) ?? 'Untitled';
  const id = `tmdb-${kind}-${row.id}`;
  const item: MediaItem = {
    id,
    type: kind,
    title,
    subtitle: kind === 'movie' ? 'Film' : 'Series',
    year: yearFromDate(kind === 'movie' ? row.release_date : row.first_air_date),
    genres: mapGenres(row.genre_ids, kind, row.genres),
    artColor: artColorFromId(id),
    imageUrl: row.poster_path ? `${IMG}${row.poster_path}` : undefined,
    ...extra,
  };
  return cacheMediaItem(item);
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error('TMDB API key missing');
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', key);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function tmdbSearch(query: string, type?: MediaType): Promise<MediaItem[]> {
  if (!isTmdbConfigured()) return [];
  const q = query.trim();

  if (!q) {
    return tmdbBrowse(type);
  }

  if (type === 'movie' || !type) {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>('/search/movie', {
      query: q,
      include_adult: 'false',
    });
    const movies = data.results.slice(0, 20).map((r) => toMediaItem(r, 'movie'));
    if (type === 'movie') return movies;
    const tv = await tmdbFetch<{ results: TmdbMovie[] }>('/search/tv', {
      query: q,
      include_adult: 'false',
    });
    const shows = tv.results.slice(0, 20).map((r) => toMediaItem(r, 'show'));
    const merged = [...movies, ...shows];
    cacheMediaItems(merged);
    return merged;
  }

  if (type === 'show') {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>('/search/tv', {
      query: q,
      include_adult: 'false',
    });
    return data.results.slice(0, 20).map((r) => toMediaItem(r, 'show'));
  }

  return [];
}

async function tmdbBrowse(type?: MediaType): Promise<MediaItem[]> {
  if (type === 'movie' || !type) {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>('/movie/popular');
    const movies = data.results.slice(0, 15).map((r) => toMediaItem(r, 'movie'));
    if (type === 'movie') return movies;
    const tv = await tmdbFetch<{ results: TmdbMovie[] }>('/tv/popular');
    const shows = tv.results.slice(0, 15).map((r) => toMediaItem(r, 'show'));
    return [...movies, ...shows];
  }
  if (type === 'show') {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>('/tv/popular');
    return data.results.slice(0, 20).map((r) => toMediaItem(r, 'show'));
  }
  return [];
}

export async function tmdbGetById(id: string): Promise<MediaItem | null> {
  const parsed = parseTmdbId(id);
  if (!parsed || !isTmdbConfigured()) return null;

  if (parsed.kind === 'movie') {
    const row = await tmdbFetch<TmdbMovie>(`/movie/${parsed.tmdbId}`);
    return toMediaItem(row, 'movie');
  }

  const row = await tmdbFetch<TmdbTvDetail>(`/tv/${parsed.tmdbId}`);
  const seasons = row.number_of_seasons;
  const episodes =
    seasons && row.number_of_episodes
      ? Math.max(1, Math.round(row.number_of_episodes / seasons))
      : undefined;
  return toMediaItem(row, 'show', {
    seasons,
    episodesPerSeason: episodes,
  });
}

export async function tmdbListGenres(): Promise<string[]> {
  if (!isTmdbConfigured()) return [];
  try {
    const [movies, tv] = await Promise.all([
      tmdbFetch<{ genres: { name: string }[] }>('/genre/movie/list'),
      tmdbFetch<{ genres: { name: string }[] }>('/genre/tv/list'),
    ]);
    const set = new Set<string>();
    for (const g of [...movies.genres, ...tv.genres]) set.add(g.name);
    return [...set].sort();
  } catch {
    return Object.values({ ...GENRE_MOVIE, ...GENRE_TV });
  }
}
