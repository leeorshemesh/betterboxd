import type { Review } from '@/types';
import { CURRENT_USER_ID } from './users';

export const mockReviews: Review[] = [
  {
    id: 'rev-1',
    userId: 'user-maya',
    target: { mediaId: 'movie-parasite' },
    mediaType: 'movie',
    rating: 5,
    body: 'A perfect machine of suspense and class satire. Every rewatch reveals another trap door.',
    tags: ['thriller', 'masterpiece', 'rewatch'],
    createdAt: '2026-10-18T14:22:00.000Z',
    interactionCount: 24,
  },
  {
    id: 'rev-2',
    userId: 'user-jordan',
    target: { mediaId: 'show-severance', season: 2, episode: 7 },
    mediaType: 'show',
    rating: 4.5,
    body: 'Episode 7 is the season’s thesis statement. Cold, funny, and quietly devastating.',
    tags: ['s2e7', 'thriller', 'workplace'],
    createdAt: '2026-10-19T09:10:00.000Z',
    interactionCount: 18,
  },
  {
    id: 'rev-3',
    userId: 'user-sam',
    target: { mediaId: 'book-piranesi' },
    mediaType: 'book',
    rating: 5,
    body: 'A labyrinth that feels like kindness. Short, strange, and impossible to forget.',
    tags: ['fantasy', 'literary', 'comfort'],
    createdAt: '2026-10-17T20:05:00.000Z',
    interactionCount: 11,
  },
  {
    id: 'rev-4',
    userId: 'user-maya',
    target: { mediaId: 'music-blonde', musicKind: 'album' },
    mediaType: 'music',
    rating: 4.5,
    body: 'Still the gold standard for intimate maximalism. Nights alone could carry a lesser album.',
    tags: ['r&b', 'album', 'late-night'],
    createdAt: '2026-10-16T23:40:00.000Z',
    interactionCount: 31,
  },
  {
    id: 'rev-5',
    userId: CURRENT_USER_ID,
    target: { mediaId: 'movie-arrival' },
    mediaType: 'movie',
    rating: 4.5,
    body: 'Language as time travel. Villeneuve makes wonder feel precise instead of vague.',
    tags: ['sci-fi', 'emotional'],
    createdAt: '2026-10-15T18:00:00.000Z',
    interactionCount: 7,
  },
  {
    id: 'rev-6',
    userId: CURRENT_USER_ID,
    target: { mediaId: 'show-succession', season: 4 },
    mediaType: 'show',
    rating: 5,
    body: 'Season 4 is Shakespeare with helicopters. The final hour still hurts.',
    tags: ['drama', 's4', 'finale'],
    createdAt: '2026-10-12T21:30:00.000Z',
    interactionCount: 15,
  },
  {
    id: 'rev-7',
    userId: 'user-jordan',
    target: { mediaId: 'show-bear', season: 3 },
    mediaType: 'show',
    rating: 3.5,
    body: 'Stress cooking as prestige TV. Season 3 is messier — sometimes productively.',
    tags: ['comedy', 'kitchen'],
    createdAt: '2026-10-20T11:00:00.000Z',
    interactionCount: 9,
  },
  {
    id: 'rev-8',
    userId: 'user-sam',
    target: { mediaId: 'book-tomorrow' },
    mediaType: 'book',
    rating: 4,
    body: 'A love letter to collaboration and the games that raise us. Soft without being soft-headed.',
    tags: ['friendship', 'gaming'],
    createdAt: '2026-10-14T16:45:00.000Z',
    interactionCount: 6,
  },
  {
    id: 'rev-9',
    userId: CURRENT_USER_ID,
    target: { mediaId: 'music-nights', musicKind: 'song' },
    mediaType: 'music',
    rating: 5,
    body: 'The mid-song flip still feels illegal. Peak Frank.',
    tags: ['song', 'r&b', 'favorites'],
    createdAt: '2026-10-10T22:15:00.000Z',
    interactionCount: 12,
  },
  {
    id: 'rev-10',
    userId: 'user-maya',
    target: { mediaId: 'movie-aftersun' },
    mediaType: 'movie',
    rating: 4.5,
    body: 'Memory as handheld camcorder. Quiet devastation done right.',
    tags: ['drama', 'grief'],
    createdAt: '2026-10-21T08:20:00.000Z',
    interactionCount: 20,
  },
  {
    id: 'rev-11',
    userId: CURRENT_USER_ID,
    target: { mediaId: 'book-klara' },
    mediaType: 'book',
    rating: 4,
    body: 'Ishiguro’s android gaze makes love look like observation. Tender and slightly chilling.',
    tags: ['literary', 'sci-fi'],
    createdAt: '2026-10-08T14:00:00.000Z',
    interactionCount: 4,
  },
  {
    id: 'rev-12',
    userId: 'user-sam',
    target: { mediaId: 'music-radiohead', musicKind: 'artist' },
    mediaType: 'music',
    rating: 4.5,
    body: 'An entire career of productive unease. Still the house band for late capitalism.',
    tags: ['artist', 'alt-rock'],
    createdAt: '2026-10-13T19:00:00.000Z',
    interactionCount: 8,
  },
];

export function getReviewById(id: string): Review | undefined {
  return mockReviews.find((r) => r.id === id);
}

export function getReviewsByUser(userId: string): Review[] {
  return mockReviews
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPublicReviewsForMedia(mediaId: string): Review[] {
  // Phase 1: filter by author's public profile flag in the store/UI layer
  return mockReviews
    .filter((r) => r.target.mediaId === mediaId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
