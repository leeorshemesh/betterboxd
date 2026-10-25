import { HttpError } from './http.js';

const MEDIA_TYPES = ['movie', 'show', 'book', 'music'] as const;
const MUSIC_KINDS = ['song', 'album', 'artist'] as const;
const TOP_MODES = ['mixed', 'movie', 'show', 'book', 'music'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];
export type MusicKind = (typeof MUSIC_KINDS)[number];
export type TopMode = (typeof TOP_MODES)[number];

export interface MediaSnapshot {
  id: string;
  type: MediaType;
  title: string;
  subtitle: string | null;
  year: number | null;
  genres: string[];
  artColor: string;
  imageUrl: string | null;
  artist: string | null;
  album: string | null;
  musicKind: MusicKind | null;
}

export interface TopSlot {
  mediaId: string;
  rank: number;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Expected a JSON object');
  }
  return body as Record<string, unknown>;
}

export function requiredText(value: unknown, field: string, max: number, min = 1): string {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required`);
  const text = value.trim();
  if (text.length < min) throw new HttpError(400, `${field} is required`);
  if (text.length > max) throw new HttpError(400, `${field} is too long`);
  return text;
}

export function parseEmail(value: unknown): string {
  const email = requiredText(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email is invalid');
  return email;
}

export function parseUsername(value: unknown): string {
  const username = requiredText(value, 'username', 20, 3);
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    throw new HttpError(400, 'Username can use letters, numbers, dots, and underscores');
  }
  return username;
}

export function parsePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters');
  }
  if (value.length > 200) throw new HttpError(400, 'Password is too long');
  return value;
}

export function parseDisplayName(value: unknown): string {
  return requiredText(value, 'displayName', 40);
}

export function parseBio(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') throw new HttpError(400, 'bio must be text');
  const bio = value.trim();
  if (!bio) return null;
  if (bio.length > 280) throw new HttpError(400, 'bio is too long');
  return bio;
}

export function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new HttpError(400, `${field} must be true or false`);
  return value;
}

export function parseLoggedOn(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, 'loggedOn must be YYYY-MM-DD');
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new HttpError(400, 'loggedOn is not a real date');
  }
  return value;
}

export function parseRating(value: unknown, required: boolean): number | null {
  if (value == null || value === '') {
    if (required) throw new HttpError(400, 'Rating is required');
    return null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HttpError(400, 'Rating must be a number');
  }
  const rounded = Math.round(value * 2) / 2;
  if (rounded < 0.5 || rounded > 5 || Math.abs(rounded - value) > 0.001) {
    throw new HttpError(400, 'Rating must be between 0.5 and 5 in half-star steps');
  }
  return rounded;
}

export function parseTags(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, 'tags must be an array');
  const tags = value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 24));
  return [...new Set(tags)].slice(0, 8);
}

export function parseOptionalInt(value: unknown, field: string): number | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 500) {
    throw new HttpError(400, `${field} must be a positive integer`);
  }
  return value;
}

export function parseMusicKind(value: unknown): MusicKind | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !MUSIC_KINDS.includes(value as MusicKind)) {
    throw new HttpError(400, 'musicKind must be song, album, or artist');
  }
  return value as MusicKind;
}

export function parseMediaType(value: unknown): MediaType {
  if (typeof value !== 'string' || !MEDIA_TYPES.includes(value as MediaType)) {
    throw new HttpError(400, 'media type is invalid');
  }
  return value as MediaType;
}

export function parseTopMode(value: unknown): TopMode {
  if (typeof value !== 'string' || !TOP_MODES.includes(value as TopMode)) {
    throw new HttpError(400, 'mode is invalid');
  }
  return value as TopMode;
}

export function parseMedia(value: unknown): MediaSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'media is required');
  }
  const media = value as Record<string, unknown>;
  const type = parseMediaType(media.type);
  const id = requiredText(media.id, 'media.id', 200);
  const title = requiredText(media.title, 'media.title', 300);
  const subtitle =
    typeof media.subtitle === 'string' && media.subtitle.trim()
      ? media.subtitle.trim().slice(0, 300)
      : null;
  const year =
    typeof media.year === 'number' && Number.isInteger(media.year) && media.year > 0
      ? media.year
      : null;
  const genres = Array.isArray(media.genres)
    ? media.genres
        .filter((genre): genre is string => typeof genre === 'string')
        .map((genre) => genre.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const artColor =
    typeof media.artColor === 'string' && media.artColor.trim()
      ? media.artColor.trim().slice(0, 32)
      : '#3A4A2A';
  let imageUrl: string | null = null;
  if (typeof media.imageUrl === 'string' && /^https?:\/\//i.test(media.imageUrl.trim())) {
    const url = media.imageUrl.trim();
    if (url.length <= 2000) imageUrl = url;
  }
  const artist =
    typeof media.artist === 'string' && media.artist.trim()
      ? media.artist.trim().slice(0, 300)
      : null;
  const album =
    typeof media.album === 'string' && media.album.trim()
      ? media.album.trim().slice(0, 300)
      : null;
  return {
    id,
    type,
    title,
    subtitle,
    year,
    genres,
    artColor,
    imageUrl,
    artist,
    album,
    musicKind: parseMusicKind(media.musicKind),
  };
}

export function parseSlots(value: unknown): TopSlot[] {
  if (!Array.isArray(value)) throw new HttpError(400, 'slots must be an array');
  if (value.length > 5) throw new HttpError(400, 'Top Five holds at most 5 titles');
  return value.map((slot) => {
    if (!slot || typeof slot !== 'object') throw new HttpError(400, 'Invalid top five slot');
    const record = slot as Record<string, unknown>;
    return {
      mediaId: requiredText(record.mediaId, 'mediaId', 200),
      rank: parseOptionalInt(record.rank, 'rank') ?? 0,
    };
  }).map((slot) => {
    if (slot.rank < 1) throw new HttpError(400, 'rank must be an integer from 1 to 5');
    return slot;
  });
}

export function parseReviewDraft(value: unknown): { rating: number; body: string; tags: string[] } | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'review must be an object');
  }
  const review = value as Record<string, unknown>;
  const rating = parseRating(review.rating, true);
  return {
    rating: rating as number,
    body: requiredText(review.body, 'review body', 5000),
    tags: parseTags(review.tags),
  };
}

export function initialsFor(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const PALETTE = ['#3A4A2A', '#2A3A4A', '#4A2A3A', '#3A2A1A', '#2A3A3A', '#4A3A2A'];

export function colorFor(username: string): string {
  let hash = 0;
  for (const char of username) hash = (hash + char.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash] ?? PALETTE[0];
}

export function likeContains(query: string): string {
  const escaped = query.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}
