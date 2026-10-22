import type { MediaItem, MusicTargetKind } from '@/types';
import { artColorFromId } from '@/services/artColor';
import { cacheMediaItem, cacheMediaItems } from '@/services/mediaCache';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';

type SpotifyImage = { url: string };
type SpotifyArtistRef = { name: string };

type Track = {
  id: string;
  name: string;
  artists?: SpotifyArtistRef[];
  album?: { name?: string; images?: SpotifyImage[]; release_date?: string };
};

type Album = {
  id: string;
  name: string;
  artists?: SpotifyArtistRef[];
  images?: SpotifyImage[];
  release_date?: string;
};

type Artist = {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
};

let cachedToken: { value: string; expiresAt: number } | null = null;

/** ASCII base64 for Client Credentials header (Hermes-safe). */
function base64Encode(input: string): string {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(input);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;
  while (i < input.length) {
    const a = input.charCodeAt(i++);
    const b = i < input.length ? input.charCodeAt(i++) : NaN;
    const c = i < input.length ? input.charCodeAt(i++) : NaN;
    const bitmap = (a << 16) | ((Number.isNaN(b) ? 0 : b) << 8) | (Number.isNaN(c) ? 0 : c);
    output += chars.charAt((bitmap >> 18) & 63);
    output += chars.charAt((bitmap >> 12) & 63);
    output += Number.isNaN(b) ? '=' : chars.charAt((bitmap >> 6) & 63);
    output += Number.isNaN(c) ? '=' : chars.charAt(bitmap & 63);
  }
  return output;
}

function clientId(): string | undefined {
  return process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || undefined;
}

function clientSecret(): string | undefined {
  // Dev-only: Client Credentials need a secret. Prefer a server proxy in production.
  return process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || undefined;
}

export function isSpotifyConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function parseSpotifyId(
  id: string,
): { kind: MusicTargetKind; spotifyId: string } | null {
  const m = /^spotify-(song|album|artist)-(.+)$/.exec(id);
  if (!m) return null;
  return { kind: m[1] as MusicTargetKind, spotifyId: m[2] };
}

async function getAccessToken(): Promise<string> {
  const id = clientId();
  const secret = clientSecret();
  if (!id || !secret) throw new Error('Spotify credentials missing');

  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const basic = base64Encode(`${id}:${secret}`);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function spotifyFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

function yearFrom(date?: string): number | undefined {
  if (!date || date.length < 4) return undefined;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

function trackToItem(t: Track): MediaItem {
  const id = `spotify-song-${t.id}`;
  return cacheMediaItem({
    id,
    type: 'music',
    title: t.name,
    subtitle: t.artists?.map((a) => a.name).join(', '),
    year: yearFrom(t.album?.release_date),
    genres: [],
    artColor: artColorFromId(id),
    imageUrl: t.album?.images?.[0]?.url,
    artist: t.artists?.[0]?.name,
    album: t.album?.name,
    musicKind: 'song',
  });
}

function albumToItem(a: Album): MediaItem {
  const id = `spotify-album-${a.id}`;
  return cacheMediaItem({
    id,
    type: 'music',
    title: a.name,
    subtitle: a.artists?.map((x) => x.name).join(', '),
    year: yearFrom(a.release_date),
    genres: [],
    artColor: artColorFromId(id),
    imageUrl: a.images?.[0]?.url,
    artist: a.artists?.[0]?.name,
    musicKind: 'album',
  });
}

function artistToItem(a: Artist): MediaItem {
  const id = `spotify-artist-${a.id}`;
  return cacheMediaItem({
    id,
    type: 'music',
    title: a.name,
    subtitle: 'Artist',
    genres: (a.genres ?? []).slice(0, 5),
    artColor: artColorFromId(id),
    imageUrl: a.images?.[0]?.url,
    artist: a.name,
    musicKind: 'artist',
  });
}

export async function spotifySearch(query: string): Promise<MediaItem[]> {
  if (!isSpotifyConfigured()) return [];
  const q = query.trim() || 'pop';
  const data = await spotifyFetch<{
    tracks?: { items: Track[] };
    albums?: { items: Album[] };
    artists?: { items: Artist[] };
  }>('/search', {
    q,
    type: 'track,album,artist',
    limit: '8',
  });

  const items: MediaItem[] = [
    ...(data.tracks?.items ?? []).map(trackToItem),
    ...(data.albums?.items ?? []).map(albumToItem),
    ...(data.artists?.items ?? []).map(artistToItem),
  ];
  cacheMediaItems(items);
  return items;
}

export async function spotifyGetById(id: string): Promise<MediaItem | null> {
  if (!isSpotifyConfigured()) return null;
  const parsed = parseSpotifyId(id);
  if (!parsed) return null;

  if (parsed.kind === 'song') {
    const t = await spotifyFetch<Track>(`/tracks/${parsed.spotifyId}`);
    return trackToItem(t);
  }
  if (parsed.kind === 'album') {
    const a = await spotifyFetch<Album>(`/albums/${parsed.spotifyId}`);
    return albumToItem(a);
  }
  const a = await spotifyFetch<Artist>(`/artists/${parsed.spotifyId}`);
  return artistToItem(a);
}
