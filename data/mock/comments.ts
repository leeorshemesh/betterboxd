import type { Comment } from '@/types';
import { CURRENT_USER_ID } from './users';

export const mockComments: Comment[] = [
  {
    id: 'cmt-1',
    reviewId: 'rev-1',
    userId: CURRENT_USER_ID,
    body: 'The peach scene alone deserves its own essay.',
    createdAt: '2026-10-18T16:00:00.000Z',
  },
  {
    id: 'cmt-2',
    reviewId: 'rev-1',
    userId: 'user-sam',
    body: 'Agreed — and the basement reveal still hits.',
    createdAt: '2026-10-18T17:30:00.000Z',
  },
  {
    id: 'cmt-3',
    reviewId: 'rev-2',
    userId: 'user-maya',
    body: 'That hallway shot is burned into my brain.',
    createdAt: '2026-10-19T10:00:00.000Z',
    visibilityNote: 'Jordan’s profile is private — comments visible to friends only (mock).',
  },
  {
    id: 'cmt-4',
    reviewId: 'rev-3',
    userId: 'user-maya',
    body: 'I want to live in those halls for a weekend.',
    createdAt: '2026-10-17T21:00:00.000Z',
  },
  {
    id: 'cmt-5',
    reviewId: 'rev-4',
    userId: CURRENT_USER_ID,
    body: 'Ivy + Pink + White Ferrari rotation forever.',
    createdAt: '2026-10-17T01:00:00.000Z',
  },
  {
    id: 'cmt-6',
    reviewId: 'rev-5',
    userId: 'user-maya',
    body: 'The heptapod logograms are still the best sci-fi prop design of the decade.',
    createdAt: '2026-10-15T20:00:00.000Z',
  },
  {
    id: 'cmt-7',
    reviewId: 'rev-6',
    userId: 'user-jordan',
    body: '“You’re not serious people” — career-defining line delivery.',
    createdAt: '2026-10-13T08:00:00.000Z',
  },
  {
    id: 'cmt-8',
    reviewId: 'rev-9',
    userId: 'user-sam',
    body: 'The beat switch is cinema.',
    createdAt: '2026-10-11T09:00:00.000Z',
  },
  {
    id: 'cmt-9',
    reviewId: 'rev-10',
    userId: CURRENT_USER_ID,
    body: 'Watched this on a plane and cried into a tiny napkin.',
    createdAt: '2026-10-21T12:00:00.000Z',
  },
];

export function getCommentsForReview(reviewId: string): Comment[] {
  return mockComments
    .filter((c) => c.reviewId === reviewId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getCommentsByUser(userId: string): Comment[] {
  return mockComments
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
