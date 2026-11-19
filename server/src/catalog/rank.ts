import type { MediaItem } from './types.js';

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

/**
 * Prefer exact / prefix / token matches, then popularity, then provider order.
 * Empty query keeps provider order (popularity browse) instead of alphabetical.
 */
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

    // Soft boost when raw (pre-normalize) title equals raw query
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

/** Rank each media type separately, then interleave top results. */
export function rankAndInterleaveByType(items: MediaItem[], query = ''): MediaItem[] {
  const byType = new Map<string, MediaItem[]>();
  for (const item of items) {
    const list = byType.get(item.type) ?? [];
    list.push(item);
    byType.set(item.type, list);
  }
  const ranked = [...byType.values()].map((group) => rankAndDedupe(group, query));
  const out: MediaItem[] = [];
  const seen = new Set<string>();
  let index = 0;
  let added = true;
  while (added) {
    added = false;
    for (const group of ranked) {
      const item = group[index];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      added = true;
    }
    index += 1;
  }
  return out;
}
