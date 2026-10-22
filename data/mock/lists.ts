import type { MediaList } from '@/types';
import { CURRENT_USER_ID } from './users';

export const mockLists: MediaList[] = [
  {
    id: 'list-towatch',
    userId: CURRENT_USER_ID,
    name: 'To Watch',
    kind: 'to-watch',
    mediaIds: ['movie-dune', 'show-shogun'],
  },
  {
    id: 'list-toread',
    userId: CURRENT_USER_ID,
    name: 'To Read',
    kind: 'to-read',
    mediaIds: ['book-project-hail-mary'],
  },
  {
    id: 'list-tolisten',
    userId: CURRENT_USER_ID,
    name: 'To Listen',
    kind: 'to-listen',
    mediaIds: ['music-renaissance'],
  },
];

export function getListsForUser(userId: string = CURRENT_USER_ID): MediaList[] {
  return mockLists.filter((l) => l.userId === userId);
}

export function getDefaultListForMediaType(
  type: 'movie' | 'show' | 'book' | 'music',
  userId: string = CURRENT_USER_ID,
): MediaList | undefined {
  const kind =
    type === 'book' ? 'to-read' : type === 'music' ? 'to-listen' : 'to-watch';
  return mockLists.find((l) => l.userId === userId && l.kind === kind);
}
