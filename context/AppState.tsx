import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { mockComments } from '@/data/mock/comments';
import { mockLists } from '@/data/mock/lists';
import { mockReviews } from '@/data/mock/reviews';
import {
  CURRENT_USER_ID,
  defaultTopFive,
  getFriends,
  getUserById,
  topFiveByType,
} from '@/data/mock/users';
import type {
  Comment,
  FeedActivity,
  FeedFilter,
  MediaList,
  MediaType,
  MusicTargetKind,
  Review,
  TopFiveConfig,
  TopFiveMode,
  User,
} from '@/types';

export interface NewReviewInput {
  mediaId: string;
  mediaType: MediaType;
  rating: number;
  body: string;
  tags: string[];
  season?: number;
  episode?: number;
  musicKind?: MusicTargetKind;
}

interface AppStateValue {
  currentUser: User;
  friends: User[];
  reviews: Review[];
  comments: Comment[];
  lists: MediaList[];
  topFive: TopFiveConfig;
  setTopFiveMode: (mode: TopFiveMode) => void;
  addReview: (input: NewReviewInput) => Review;
  addComment: (reviewId: string, body: string) => Comment;
  addToList: (mediaId: string, mediaType: MediaType) => { list: MediaList; added: boolean };
  getReview: (id: string) => Review | undefined;
  getCommentsForReview: (reviewId: string) => Comment[];
  getReviewsForUser: (userId: string) => Review[];
  getPublicReviewsForMedia: (mediaId: string) => Review[];
  getFeed: (filter: FeedFilter) => FeedActivity[];
  getUserComments: (userId?: string) => Comment[];
}

const AppStateContext = createContext<AppStateValue | null>(null);

function buildFeed(reviews: Review[], comments: Comment[], friendIds: string[]): FeedActivity[] {
  const friendSet = new Set(friendIds);
  const activities: FeedActivity[] = [];

  for (const r of reviews) {
    if (!friendSet.has(r.userId) && r.userId !== CURRENT_USER_ID) continue;
    // Feed is friend-scoped; include friends' reviews (not own)
    if (!friendSet.has(r.userId)) continue;
    activities.push({
      id: `feed-rev-${r.id}`,
      kind: 'review',
      userId: r.userId,
      reviewId: r.id,
      mediaType: r.mediaType,
      createdAt: r.createdAt,
    });
  }

  for (const c of comments) {
    const review = reviews.find((r) => r.id === c.reviewId);
    if (!review) continue;
    if (!friendSet.has(c.userId)) continue;
    activities.push({
      id: `feed-cmt-${c.id}`,
      kind: 'comment',
      userId: c.userId,
      reviewId: c.reviewId,
      commentId: c.id,
      mediaType: review.mediaType,
      createdAt: c.createdAt,
    });
  }

  return activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const currentUser = getUserById(CURRENT_USER_ID)!;
  const friends = getFriends(CURRENT_USER_ID);

  const [reviews, setReviews] = useState<Review[]>(() => [...mockReviews]);
  const [comments, setComments] = useState<Comment[]>(() => [...mockComments]);
  const [lists, setLists] = useState<MediaList[]>(() =>
    mockLists.map((l) => ({ ...l, mediaIds: [...l.mediaIds] })),
  );
  const [topFive, setTopFive] = useState<TopFiveConfig>(() => ({
    ...defaultTopFive,
    slots: [...defaultTopFive.slots],
  }));

  const setTopFiveMode = useCallback((mode: TopFiveMode) => {
    if (mode === 'mixed') {
      setTopFive({ ...defaultTopFive, slots: [...defaultTopFive.slots] });
    } else {
      const config = topFiveByType[mode];
      setTopFive({ ...config, slots: [...config.slots] });
    }
  }, []);

  const addReview = useCallback((input: NewReviewInput): Review => {
    const review: Review = {
      id: `rev-local-${Date.now()}`,
      userId: CURRENT_USER_ID,
      target: {
        mediaId: input.mediaId,
        season: input.season,
        episode: input.episode,
        musicKind: input.musicKind,
      },
      mediaType: input.mediaType,
      rating: input.rating,
      body: input.body,
      tags: input.tags,
      createdAt: new Date().toISOString(),
      interactionCount: 0,
    };
    setReviews((prev) => [review, ...prev]);
    return review;
  }, []);

  const addComment = useCallback((reviewId: string, body: string): Comment => {
    const comment: Comment = {
      id: `cmt-local-${Date.now()}`,
      reviewId,
      userId: CURRENT_USER_ID,
      body,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, comment]);
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, interactionCount: r.interactionCount + 1 } : r,
      ),
    );
    return comment;
  }, []);

  const addToList = useCallback(
    (mediaId: string, mediaType: MediaType): { list: MediaList; added: boolean } => {
      const kind =
        mediaType === 'book' ? 'to-read' : mediaType === 'music' ? 'to-listen' : 'to-watch';

      const list = lists.find((l) => l.userId === CURRENT_USER_ID && l.kind === kind);
      if (!list) {
        return { list: lists[0], added: false };
      }
      if (list.mediaIds.includes(mediaId)) {
        return { list, added: false };
      }
      const updated = { ...list, mediaIds: [...list.mediaIds, mediaId] };
      setLists((prev) => prev.map((l) => (l.id === list.id ? updated : l)));
      return { list: updated, added: true };
    },
    [lists],
  );

  const getReview = useCallback(
    (id: string) => reviews.find((r) => r.id === id),
    [reviews],
  );

  const getCommentsForReview = useCallback(
    (reviewId: string) =>
      comments
        .filter((c) => c.reviewId === reviewId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments],
  );

  const getReviewsForUser = useCallback(
    (userId: string) =>
      reviews
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  );

  const getPublicReviewsForMedia = useCallback(
    (mediaId: string) =>
      reviews
        .filter((r) => {
          if (r.target.mediaId !== mediaId) return false;
          const author = getUserById(r.userId);
          return author?.isPublic !== false;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  );

  const getFeed = useCallback(
    (filter: FeedFilter) => {
      const activities = buildFeed(reviews, comments, currentUser.friendIds);
      if (filter === 'all') return activities;
      return activities.filter((a) => a.mediaType === filter);
    },
    [reviews, comments, currentUser.friendIds],
  );

  const getUserComments = useCallback(
    (userId: string = CURRENT_USER_ID) =>
      comments
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [comments],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      currentUser,
      friends,
      reviews,
      comments,
      lists,
      topFive,
      setTopFiveMode,
      addReview,
      addComment,
      addToList,
      getReview,
      getCommentsForReview,
      getReviewsForUser,
      getPublicReviewsForMedia,
      getFeed,
      getUserComments,
    }),
    [
      currentUser,
      friends,
      reviews,
      comments,
      lists,
      topFive,
      setTopFiveMode,
      addReview,
      addComment,
      addToList,
      getReview,
      getCommentsForReview,
      getReviewsForUser,
      getPublicReviewsForMedia,
      getFeed,
      getUserComments,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
