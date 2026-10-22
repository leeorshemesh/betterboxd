import type { MediaItem } from '@/types';
import { artColorFromId } from '@/services/artColor';
import { cacheMediaItem, cacheMediaItems } from '@/services/mediaCache';

type OlDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
};

function workIdFromKey(key?: string): string | null {
  if (!key) return null;
  // "/works/OL45804W" → OL45804W
  const m = /\/works\/([^/]+)/.exec(key);
  return m?.[1] ?? key.replace(/\//g, '-');
}

function coverUrl(coverId?: number): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function toMediaItem(doc: OlDoc): MediaItem | null {
  const workId = workIdFromKey(doc.key);
  if (!workId || !doc.title) return null;
  const id = `ol-book-${workId}`;
  const genres = (doc.subject ?? [])
    .filter((s) => s.length < 40)
    .slice(0, 5);
  return cacheMediaItem({
    id,
    type: 'book',
    title: doc.title,
    subtitle: doc.author_name?.[0],
    year: doc.first_publish_year,
    genres,
    artColor: artColorFromId(id),
    imageUrl: coverUrl(doc.cover_i),
  });
}

export function parseOpenLibraryId(id: string): string | null {
  const m = /^ol-book-(.+)$/.exec(id);
  return m?.[1] ?? null;
}

export async function openLibrarySearch(query: string): Promise<MediaItem[]> {
  const q = query.trim() || 'award winning fiction';
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '20');
  url.searchParams.set('fields', 'key,title,author_name,first_publish_year,cover_i,subject');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = (await res.json()) as { docs?: OlDoc[] };
  const items = (data.docs ?? [])
    .map(toMediaItem)
    .filter((x): x is MediaItem => Boolean(x));
  cacheMediaItems(items);
  return items;
}

export async function openLibraryGetById(id: string): Promise<MediaItem | null> {
  const workId = parseOpenLibraryId(id);
  if (!workId) return null;

  const res = await fetch(`https://openlibrary.org/works/${workId}.json`);
  if (!res.ok) return null;
  const work = (await res.json()) as {
    title?: string;
    description?: string | { value?: string };
    covers?: number[];
    subjects?: string[];
  };

  // Authors via separate call is heavy; search by title for subtitle if needed
  const item = cacheMediaItem({
    id,
    type: 'book',
    title: work.title ?? 'Untitled',
    subtitle: undefined,
    genres: (work.subjects ?? []).filter((s) => s.length < 40).slice(0, 6),
    artColor: artColorFromId(id),
    imageUrl: work.covers?.[0] ? coverUrl(work.covers[0]) : undefined,
  });
  return item;
}
