import { env } from '../env.js';
import { artColorFromId } from './artColor.js';
import type { MediaItem, MusicKind } from './types.js';

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

function clientId(): string | undefined {
  return env('SPOTIFY_CLIENT_ID');
}

function clientSecret(): string | undefined {
  return env('SPOTIFY_CLIENT_SECRET');
}

export function isSpotifyConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function parseSpotifyId(id: string): { kind: MusicKind; spotifyId: string } | null {
  const m = /^spotify-(song|album|artist)-(.+)$/.exec(id);
  if (!m) return null;
  return { kind: m[1] as MusicKind, spotifyId: m[2] };
}

async function getAccessToken(): Promise<string> {
  const id = clientId();
  const secret = clientSecret();
  if (!id || !secret) throw new Error('Spotify credentials missing');

  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
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
  return {
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
  };
}

function albumToItem(a: Album): MediaItem {
  const id = `spotify-album-${a.id}`;
  return {
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
  };
}

function artistToItem(a: Artist): MediaItem {
  const id = `spotify-artist-${a.id}`;
  return {
    id,
    type: 'music',
    title: a.name,
    subtitle: 'Artist',
    genres: (a.genres ?? []).slice(0, 5),
    artColor: artColorFromId(id),
    imageUrl: a.images?.[0]?.url,
    artist: a.name,
    musicKind: 'artist',
  };
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

  return [
    ...(data.tracks?.items ?? []).map(trackToItem),
    ...(data.albums?.items ?? []).map(albumToItem),
    ...(data.artists?.items ?? []).map(artistToItem),
  ];
}

export async function spotifyGetById(id: string): Promise<MediaItem | null> {
  if (!isSpotifyConfigured()) return null;
  const parsed = parseSpotifyId(id);
  if (!parsed) return null;

  if (parsed.kind === 'song') {
    return trackToItem(await spotifyFetch<Track>(`/tracks/${parsed.spotifyId}`));
  }
  if (parsed.kind === 'album') {
    return albumToItem(await spotifyFetch<Album>(`/albums/${parsed.spotifyId}`));
  }
  return artistToItem(await spotifyFetch<Artist>(`/artists/${parsed.spotifyId}`));
}
