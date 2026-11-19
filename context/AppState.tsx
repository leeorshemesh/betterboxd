import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/Auth';
import { api, ApiError } from '@/services/api';
import { cacheMediaItems } from '@/services/mediaCache';
import type {
  Comment,
  DiaryEntry,
  FeedActivity,
  FeedFilter,
  FriendRequest,
  MediaItem,
  MediaList,
  MediaType,
  MusicTargetKind,
  Review,
  TopFiveConfig,
  TopFiveMode,
  User,
  UserSearchHit,
} from '@/types';

export interface NewLogInput {
  media: MediaItem;
  loggedOn: string;
  rating?: number;
  body?: string;
  tags: string[];
  season?: number;
  episode?: number;
  musicKind?: MusicTargetKind;
}

interface AccountPayload {
  user: User;
  friends: User[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  lists: MediaList[];
  topFive: TopFiveConfig;
}

interface DiaryPayload {
  entries: DiaryEntry[];
  reviews: Review[];
}

interface FeedPayload {
  activities: FeedActivity[];
  reviews: Review[];
  comments: Comment[];
}

interface AppStateValue {
  currentUser: User;
  friends: User[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  diary: DiaryEntry[];
  reviews: Review[];
  comments: Comment[];
  lists: MediaList[];
  topFive: TopFiveConfig;
  setTopFiveMode: (mode: TopFiveMode) => void;
  setTopFiveSlots: (mode: TopFiveMode, slots: TopFiveConfig['slots']) => Promise<void>;
  logTitle: (input: NewLogInput) => Promise<{ entry: DiaryEntry; review: Review | null }>;
  deleteDiary: (entryId: string) => Promise<void>;
  addComment: (reviewId: string, body: string) => Promise<Comment>;
  addToList: (media: MediaItem) => Promise<{ list: MediaList; added: boolean }>;
  removeFromList: (mediaId: string) => Promise<void>;
  updateProfile: (patch: { displayName?: string; bio?: string; isPublic?: boolean }) => Promise<void>;
  searchUsers: (query: string) => Promise<UserSearchHit[]>;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (id: string) => Promise<void>;
  declineFriendRequest: (id: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  loadReview: (id: string) => Promise<void>;
  loadMediaReviews: (type: string, mediaId: string) => Promise<void>;
  getUser: (id: string) => User | undefined;
  getReview: (id: string) => Review | undefined;
  getCommentsForReview: (reviewId: string) => Comment[];
  getReviewsForUser: (userId: string) => Review[];
  getPublicReviewsForMedia: (mediaId: string) => Review[];
  getFeed: (filter: FeedFilter) => FeedActivity[];
  getUserComments: (userId?: string) => Comment[];
}

const AppStateContext = createContext<AppStateValue | null>(null);

function byLoggedOn(a: DiaryEntry, b: DiaryEntry): number {
  const day = b.loggedOn.localeCompare(a.loggedOn);
  if (day !== 0) return day;
  return b.createdAt.localeCompare(a.createdAt);
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

function rememberUsers(current: User[], incoming: Array<User | undefined>): User[] {
  const map = new Map(current.map((user) => [user.id, user]));
  for (const user of incoming) {
    if (!user) continue;
    const existing = map.get(user.id);
    map.set(
      user.id,
      existing
        ? {
            ...existing,
            ...user,
            friendIds: user.friendIds.length > 0 ? user.friendIds : existing.friendIds,
          }
        : user,
    );
  }
  return [...map.values()];
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [lists, setLists] = useState<MediaList[]>([]);
  const [topFive, setTopFive] = useState<TopFiveConfig>({ mode: 'mixed', slots: [] });
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [directory, setDirectory] = useState<User[]>([]);

  const applyAccount = useCallback((account: AccountPayload) => {
    setCurrentUser(account.user);
    setFriends(account.friends);
    setIncomingRequests(account.incomingRequests);
    setOutgoingRequests(account.outgoingRequests);
    setLists(account.lists);
    setTopFive(account.topFive);
    setDirectory((prev) => rememberUsers(prev, [account.user, ...account.friends]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setLoadError(null);
    (async () => {
      try {
        const [account, diaryPayload, feedPayload, mine] = await Promise.all([
          api<AccountPayload>('/auth/me'),
          api<DiaryPayload>('/diary'),
          api<FeedPayload>('/feed'),
          api<{ comments: Comment[] }>('/me/comments'),
        ]);
        if (cancelled) return;
        applyAccount(account);
        setDiary([...diaryPayload.entries].sort(byLoggedOn));
        cacheMediaItems(diaryPayload.entries.map((entry) => entry.media));
        cacheMediaItems(
          [...diaryPayload.reviews, ...feedPayload.reviews]
            .map((review) => review.media)
            .filter((media): media is MediaItem => Boolean(media)),
        );
        setReviews(mergeById(diaryPayload.reviews, feedPayload.reviews));
        setComments(mergeById(mine.comments, feedPayload.comments));
        setActivities(feedPayload.activities);
        setDirectory((prev) =>
          rememberUsers(prev, [
            account.user,
            ...account.friends,
            ...diaryPayload.reviews.map((review) => review.author),
            ...feedPayload.reviews.map((review) => review.author),
            ...mine.comments.map((comment) => comment.author),
            ...feedPayload.comments.map((comment) => comment.author),
          ]),
        );
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          await signOut();
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Could not load your account');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, applyAccount, signOut]);

  const reloadAccount = useCallback(async () => {
    applyAccount(await api<AccountPayload>('/auth/me'));
  }, [applyAccount]);

  const setTopFiveMode = useCallback((mode: TopFiveMode) => {
    setTopFive((prev) => ({ ...prev, mode }));
    void api<{ topFive: TopFiveConfig }>('/top-five', { method: 'PATCH', body: { mode } })
      .then((result) => setTopFive(result.topFive))
      .catch(() => undefined);
  }, []);

  const setTopFiveSlots = useCallback(async (mode: TopFiveMode, slots: TopFiveConfig['slots']) => {
    const result = await api<{ topFive: TopFiveConfig }>('/top-five', {
      method: 'PATCH',
      body: { mode, slots },
    });
    setTopFive(result.topFive);
  }, []);

  const logTitle = useCallback(async (input: NewLogInput) => {
    const body = input.body?.trim();
    const result = await api<{ entry: DiaryEntry; review: Review | null }>('/diary', {
      method: 'POST',
      body: {
        media: input.media,
        loggedOn: input.loggedOn,
        season: input.season,
        episode: input.episode,
        musicKind: input.musicKind,
        rating: input.rating,
        review: body
          ? { body, tags: input.tags, rating: input.rating }
          : undefined,
      },
    });
    cacheMediaItems([result.entry.media]);
    setDiary((prev) =>
      [result.entry, ...prev.filter((entry) => entry.id !== result.entry.id)].sort(byLoggedOn),
    );
    if (result.review) {
      setReviews((prev) => mergeById(prev, [result.review!]));
      setDirectory((prev) => rememberUsers(prev, [result.review?.author]));
    }
    return result;
  }, []);

  const deleteDiary = useCallback(async (entryId: string) => {
    await api(`/diary/${entryId}`, { method: 'DELETE' });
    setDiary((prev) => {
      const entry = prev.find((item) => item.id === entryId);
      if (entry?.reviewId) {
        setReviews((reviewsPrev) => reviewsPrev.filter((review) => review.id !== entry.reviewId));
      }
      return prev.filter((item) => item.id !== entryId);
    });
  }, []);

  const addComment = useCallback(async (reviewId: string, body: string) => {
    const result = await api<{ comment: Comment }>(`/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: { body },
    });
    setComments((prev) => mergeById(prev, [result.comment]));
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { ...review, interactionCount: review.interactionCount + 1 }
          : review,
      ),
    );
    setDirectory((prev) => rememberUsers(prev, [result.comment.author]));
    return result.comment;
  }, []);

  const addToList = useCallback(async (media: MediaItem) => {
    cacheMediaItems([media]);
    const result = await api<{ list: MediaList; added: boolean }>('/lists/items', {
      method: 'POST',
      body: { media },
    });
    setLists((prev) => prev.map((list) => (list.id === result.list.id ? result.list : list)));
    return result;
  }, []);

  const removeFromList = useCallback(async (mediaId: string) => {
    const result = await api<{ lists: MediaList[] }>(`/lists/items/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
    });
    setLists(result.lists);
  }, []);

  const updateProfile = useCallback(
    async (patch: { displayName?: string; bio?: string; isPublic?: boolean }) => {
      applyAccount(await api<AccountPayload>('/users/me', { method: 'PATCH', body: patch }));
    },
    [applyAccount],
  );

  const searchUsers = useCallback(async (query: string) => {
    const result = await api<{ results: UserSearchHit[] }>(
      `/users/search?q=${encodeURIComponent(query)}`,
    );
    setDirectory((prev) => rememberUsers(prev, result.results.map((hit) => hit.user)));
    return result.results;
  }, []);

  const sendFriendRequest = useCallback(
    async (username: string) => {
      await api('/friends/requests', { method: 'POST', body: { username } });
      await reloadAccount();
    },
    [reloadAccount],
  );

  const acceptFriendRequest = useCallback(
    async (id: string) => {
      await api(`/friends/requests/${id}/accept`, { method: 'POST' });
      await reloadAccount();
    },
    [reloadAccount],
  );

  const declineFriendRequest = useCallback(
    async (id: string) => {
      await api(`/friends/requests/${id}/decline`, { method: 'POST' });
      await reloadAccount();
    },
    [reloadAccount],
  );

  const removeFriend = useCallback(
    async (userId: string) => {
      await api(`/friends/${userId}`, { method: 'DELETE' });
      await reloadAccount();
    },
    [reloadAccount],
  );

  const loadReview = useCallback(async (id: string) => {
    const result = await api<{ review: Review; comments: Comment[] }>(`/reviews/${id}`);
    setReviews((prev) => mergeById(prev, [result.review]));
    setComments((prev) => [
      ...prev.filter((comment) => comment.reviewId !== id),
      ...result.comments,
    ]);
    setDirectory((prev) =>
      rememberUsers(prev, [result.review.author, ...result.comments.map((comment) => comment.author)]),
    );
  }, []);

  const loadMediaReviews = useCallback(async (type: string, mediaId: string) => {
    const result = await api<{ reviews: Review[] }>(
      `/media/${encodeURIComponent(type)}/${encodeURIComponent(mediaId)}/reviews`,
    );
    setReviews((prev) => [
      ...prev.filter((review) => review.target.mediaId !== mediaId),
      ...result.reviews,
    ]);
    setDirectory((prev) => rememberUsers(prev, result.reviews.map((review) => review.author)));
  }, []);

  const getUser = useCallback(
    (id: string) => {
      if (currentUser?.id === id) return currentUser;
      return directory.find((user) => user.id === id);
    },
    [currentUser, directory],
  );

  const getReview = useCallback((id: string) => reviews.find((review) => review.id === id), [reviews]);

  const getCommentsForReview = useCallback(
    (reviewId: string) =>
      comments
        .filter((comment) => comment.reviewId === reviewId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments],
  );

  const getReviewsForUser = useCallback(
    (userId: string) =>
      reviews
        .filter((review) => review.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  );

  const getPublicReviewsForMedia = useCallback(
    (mediaId: string) =>
      reviews
        .filter((review) => review.target.mediaId === mediaId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  );

  const getFeed = useCallback(
    (filter: FeedFilter) => {
      if (filter === 'all') return activities;
      return activities.filter((activity) => activity.mediaType === filter);
    },
    [activities],
  );

  const getUserComments = useCallback(
    (userId?: string) =>
      comments
        .filter((comment) => comment.userId === (userId ?? currentUser?.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [comments, currentUser?.id],
  );

  const value = useMemo<AppStateValue | null>(() => {
    if (!currentUser) return null;
    return {
      currentUser,
      friends,
      incomingRequests,
      outgoingRequests,
      diary,
      reviews,
      comments,
      lists,
      topFive,
      setTopFiveMode,
      setTopFiveSlots,
      logTitle,
      deleteDiary,
      addComment,
      addToList,
      removeFromList,
      updateProfile,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,
      loadReview,
      loadMediaReviews,
      getUser,
      getReview,
      getCommentsForReview,
      getReviewsForUser,
      getPublicReviewsForMedia,
      getFeed,
      getUserComments,
    };
  }, [
    currentUser,
    friends,
    incomingRequests,
    outgoingRequests,
    diary,
    reviews,
    comments,
    lists,
    topFive,
    setTopFiveMode,
    setTopFiveSlots,
    logTitle,
    deleteDiary,
    addComment,
    addToList,
    removeFromList,
    updateProfile,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    loadReview,
    loadMediaReviews,
    getUser,
    getReview,
    getCommentsForReview,
    getReviewsForUser,
    getPublicReviewsForMedia,
    getFeed,
    getUserComments,
  ]);

  if (!ready || !value) {
    return (
      <View style={styles.gate}>
        {loadError ? (
          <>
            <Text style={styles.errorTitle}>Couldn’t load your account</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <Pressable style={styles.retry} onPress={() => setAttempt((n) => n + 1)}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: { ...typography.title, color: colors.text, textAlign: 'center' },
  errorBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retry: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { ...typography.bodyBold, color: colors.bg },
});
