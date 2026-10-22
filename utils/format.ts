import type { MediaItem, Review } from '@/types';

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

export function mediaTargetLabel(media: MediaItem, review: Review): string {
  const parts: string[] = [];
  if (review.target.season != null) {
    parts.push(`S${review.target.season}`);
  }
  if (review.target.episode != null) {
    parts.push(`E${review.target.episode}`);
  }
  if (review.target.musicKind) {
    parts.push(review.target.musicKind);
  }
  return parts.length ? parts.join(' · ') : '';
}

export function clampHalfStar(value: number): number {
  const clamped = Math.min(5, Math.max(0.5, value));
  return Math.round(clamped * 2) / 2;
}
