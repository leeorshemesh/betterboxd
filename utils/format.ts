import type { MediaItem, MusicTargetKind } from '@/types';

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Calendar day for a diary date (YYYY-MM-DD) or an ISO timestamp. */
export function formatDayLabel(value: string, withYear = false): string {
  const options: Intl.DateTimeFormatOptions = withYear
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' };
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
  }
  return new Date(value).toLocaleDateString(undefined, options);
}

export function formatDateYear(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRating(rating: number): string {
  return rating % 1 === 0 ? String(rating) : rating.toFixed(1);
}

export function mediaTargetLabel(
  _media: MediaItem,
  target: { season?: number; episode?: number; musicKind?: MusicTargetKind },
): string {
  const parts: string[] = [];
  if (target.season != null) {
    parts.push(`S${target.season}`);
  }
  if (target.episode != null) {
    parts.push(`E${target.episode}`);
  }
  if (target.musicKind) {
    parts.push(target.musicKind);
  }
  return parts.length ? parts.join(' · ') : '';
}

export function clampHalfStar(value: number): number {
  const clamped = Math.min(5, Math.max(0.5, value));
  return Math.round(clamped * 2) / 2;
}
