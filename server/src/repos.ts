import { randomUUID } from 'node:crypto';

import { all, get, nowIso, run, transaction } from './db.js';
import { HttpError } from './http.js';
import { hashToken } from './passwords.js';
import {
  toComment,
  toDiary,
  toReview,
  toUser,
  type CommentJson,
  type CommentRow,
  type DiaryJson,
  type DiaryRow,
  type PublicUser,
  type ReviewJson,
  type ReviewRow,
  type UserRow,
} from './serialize.js';
import type { MediaSnapshot, TopMode, TopSlot } from './validate.js';

export type FriendStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends' | 'self';

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

interface ListRow {
  id: string;
  user_id: string;
  name: string;
  kind: 'to-watch' | 'to-read' | 'to-listen' | 'custom';
}

const USER_COLUMNS = `id, email, username, password_hash, display_name, avatar_color, avatar_initials, avatar_url, bio, is_public, created_at`;

const REVIEW_SELECT = `
  SELECT
    r.id, r.user_id, r.diary_entry_id, r.rating, r.body, r.tags_json, r.created_at,
    d.media_id, d.media_type, d.title, d.subtitle, d.year, d.art_color, d.image_url,
    d.artist, d.album, d.genres_json, d.logged_on, d.season, d.episode, d.music_kind,
    u.username, u.display_name, u.avatar_color, u.avatar_initials, u.avatar_url, u.bio, u.is_public,
    (SELECT COUNT(*) FROM comments c WHERE c.review_id = r.id) AS interaction_count
  FROM reviews r
  JOIN diary_entries d ON d.id = r.diary_entry_id
  JOIN users u ON u.id = r.user_id
`;

const DIARY_SELECT = `
  SELECT
    d.id, d.user_id, d.media_id, d.media_type, d.title, d.subtitle, d.year,
    d.art_color, d.image_url, d.artist, d.album, d.genres_json, d.logged_on,
    d.season, d.episode, d.music_kind, d.rating, d.created_at,
    r.id AS review_id
  FROM diary_entries d
  LEFT JOIN reviews r ON r.diary_entry_id = d.id
`;

const COMMENT_SELECT = `
  SELECT
    c.id, c.review_id, c.user_id, c.body, c.created_at,
    u.username, u.display_name, u.avatar_color, u.avatar_initials, u.avatar_url, u.bio, u.is_public,
    author.is_public AS review_author_public,
    d.title AS media_title
  FROM comments c
  JOIN users u ON u.id = c.user_id
  JOIN reviews r ON r.id = c.review_id
  JOIN users author ON author.id = r.user_id
  JOIN diary_entries d ON d.id = r.diary_entry_id
`;

export function findUserById(id: string): UserRow | undefined {
  return get<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
}

export function findUserByEmail(email: string): UserRow | undefined {
  return get<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`, [email]);
}

export function findUserByUsername(username: string): UserRow | undefined {
  return get<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE username = ? COLLATE NOCASE`, [username]);
}

export function friendIdsFor(userId: string): string[] {
  return all<{ id: string }>(
    `SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END AS id
     FROM friendships
     WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)`,
    [userId, userId, userId],
  ).map((row) => row.id);
}

export function areFriends(a: string, b: string): boolean {
  return Boolean(
    get(
      `SELECT 1 AS ok FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
      [a, b, b, a],
    ),
  );
}

export function canViewContent(viewerId: string, authorId: string, isPublic: number): boolean {
  if (viewerId === authorId) return true;
  if (isPublic === 1) return true;
  return areFriends(viewerId, authorId);
}

function findFriendship(a: string, b: string): FriendshipRow | undefined {
  return get<FriendshipRow>(
    `SELECT * FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?)
        OR (requester_id = ? AND addressee_id = ?)`,
    [a, b, b, a],
  );
}

export function friendStatus(viewerId: string, otherId: string): FriendStatus {
  if (viewerId === otherId) return 'self';
  const row = findFriendship(viewerId, otherId);
  if (!row || row.status === 'declined') return 'none';
  if (row.status === 'accepted') return 'friends';
  return row.requester_id === viewerId ? 'pending_outgoing' : 'pending_incoming';
}

export function userForViewer(row: UserRow, viewerId: string): {
  user: PublicUser;
  restricted: boolean;
  friendStatus: FriendStatus;
} {
  const status = friendStatus(viewerId, row.id);
  const visible = canViewContent(viewerId, row.id, row.is_public);
  return {
    user: toUser(row, row.id === viewerId ? friendIdsFor(row.id) : [], visible),
    restricted: !visible,
    friendStatus: status,
  };
}

function createDefaults(userId: string): void {
  const lists: Array<[string, ListRow['kind']]> = [
    ['To Watch', 'to-watch'],
    ['To Read', 'to-read'],
    ['To Listen', 'to-listen'],
  ];
  for (const [name, kind] of lists) {
    run(`INSERT INTO lists (id, user_id, name, kind) VALUES (?, ?, ?, ?)`, [
      randomUUID(),
      userId,
      name,
      kind,
    ]);
  }
  run(
    `INSERT INTO top_five (user_id, mode, slots_json, slots_by_mode_json) VALUES (?, 'mixed', '[]', ?)`,
    [
      userId,
      JSON.stringify({ mixed: [], movie: [], show: [], book: [], music: [] }),
    ],
  );
}

export function insertUser(input: {
  id?: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
  bio?: string | null;
  isPublic?: boolean;
}): UserRow {
  const id = input.id ?? randomUUID();
  const createdAt = nowIso();
  transaction(() => {
    run(
      `INSERT INTO users (
        id, email, username, password_hash, display_name, avatar_color, avatar_initials, bio, is_public, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.email,
        input.username,
        input.passwordHash,
        input.displayName,
        input.avatarColor,
        input.avatarInitials,
        input.bio ?? null,
        input.isPublic === false ? 0 : 1,
        createdAt,
      ],
    );
    createDefaults(id);
  });
  const user = findUserById(id);
  if (!user) throw new HttpError(500, 'Could not create account');
  return user;
}

export function updateUser(
  userId: string,
  patch: { displayName?: string; bio?: string | null; isPublic?: boolean; initials?: string },
): UserRow {
  const current = findUserById(userId);
  if (!current) throw new HttpError(404, 'Account not found');
  run(
    `UPDATE users SET display_name = ?, avatar_initials = ?, bio = ?, is_public = ? WHERE id = ?`,
    [
      patch.displayName ?? current.display_name,
      patch.initials ?? current.avatar_initials,
      patch.bio !== undefined ? patch.bio : current.bio,
      patch.isPublic !== undefined ? (patch.isPublic ? 1 : 0) : current.is_public,
      userId,
    ],
  );
  return findUserById(userId)!;
}

export function createSession(userId: string, token: string, expiresAt: string): void {
  run(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), userId, hashToken(token), expiresAt, nowIso()],
  );
}

export function userIdForToken(token: string): string | undefined {
  const tokenHash = hashToken(token);
  const row = get<{ user_id: string; expires_at: string }>(
    `SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`,
    [tokenHash],
  );
  if (!row) return undefined;
  if (row.expires_at <= nowIso()) {
    run(`DELETE FROM sessions WHERE token_hash = ?`, [tokenHash]);
    return undefined;
  }
  return row.user_id;
}

export function deleteSession(token: string): void {
  run(`DELETE FROM sessions WHERE token_hash = ?`, [hashToken(token)]);
}

export interface FriendRequestJson {
  id: string;
  user: PublicUser;
  createdAt: string;
}

function requestJson(row: FriendshipRow, viewerId: string): FriendRequestJson {
  const otherId = row.requester_id === viewerId ? row.addressee_id : row.requester_id;
  const other = findUserById(otherId);
  if (!other) throw new HttpError(404, 'User not found');
  return { id: row.id, user: toUser(other, [], true), createdAt: row.created_at };
}

export function listFriends(userId: string): PublicUser[] {
  const ids = friendIdsFor(userId);
  return ids
    .map((id) => findUserById(id))
    .filter((user): user is UserRow => Boolean(user))
    .map((user) => toUser(user, [], true))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function listRequests(userId: string): {
  incoming: FriendRequestJson[];
  outgoing: FriendRequestJson[];
} {
  const incoming = all<FriendshipRow>(
    `SELECT * FROM friendships WHERE addressee_id = ? AND status = 'pending' ORDER BY created_at DESC`,
    [userId],
  ).map((row) => requestJson(row, userId));
  const outgoing = all<FriendshipRow>(
    `SELECT * FROM friendships WHERE requester_id = ? AND status = 'pending' ORDER BY created_at DESC`,
    [userId],
  ).map((row) => requestJson(row, userId));
  return { incoming, outgoing };
}

export function requestFriend(requesterId: string, username: string): FriendRequestJson {
  const target = findUserByUsername(username);
  if (!target) throw new HttpError(404, 'No user with that username');
  if (target.id === requesterId) throw new HttpError(400, 'You cannot add yourself');
  const existing = findFriendship(requesterId, target.id);
  const timestamp = nowIso();
  if (!existing) {
    const id = randomUUID();
    run(
      `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [id, requesterId, target.id, timestamp, timestamp],
    );
    return requestJson(
      {
        id,
        requester_id: requesterId,
        addressee_id: target.id,
        status: 'pending',
        created_at: timestamp,
        updated_at: timestamp,
      },
      requesterId,
    );
  }
  if (existing.status === 'accepted') throw new HttpError(409, 'You are already friends');
  if (existing.status === 'pending') {
    if (existing.requester_id === requesterId) throw new HttpError(409, 'Friend request already sent');
    throw new HttpError(409, 'They already sent you a request');
  }
  run(
    `UPDATE friendships
     SET requester_id = ?, addressee_id = ?, status = 'pending', updated_at = ?
     WHERE id = ?`,
    [requesterId, target.id, timestamp, existing.id],
  );
  return requestJson({ ...existing, requester_id: requesterId, addressee_id: target.id, status: 'pending', updated_at: timestamp }, requesterId);
}

export function acceptRequest(userId: string, requestId: string): PublicUser {
  const row = get<FriendshipRow>(`SELECT * FROM friendships WHERE id = ?`, [requestId]);
  if (!row || row.addressee_id !== userId || row.status !== 'pending') {
    throw new HttpError(404, 'Friend request not found');
  }
  run(`UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?`, [nowIso(), requestId]);
  const friend = findUserById(row.requester_id);
  if (!friend) throw new HttpError(404, 'User not found');
  return toUser(friend, [], true);
}

export function declineRequest(userId: string, requestId: string): void {
  const row = get<FriendshipRow>(`SELECT * FROM friendships WHERE id = ?`, [requestId]);
  if (!row || row.addressee_id !== userId || row.status !== 'pending') {
    throw new HttpError(404, 'Friend request not found');
  }
  run(`UPDATE friendships SET status = 'declined', updated_at = ? WHERE id = ?`, [nowIso(), requestId]);
}

/** Dev seed helper. Inserts or upgrades a pair to accepted friends. */
export function seedAcceptedFriendship(a: string, b: string): void {
  const existing = findFriendship(a, b);
  const timestamp = nowIso();
  if (!existing) {
    run(
      `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
       VALUES (?, ?, ?, 'accepted', ?, ?)`,
      [randomUUID(), a, b, timestamp, timestamp],
    );
    return;
  }
  if (existing.status !== 'accepted') {
    run(`UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?`, [timestamp, existing.id]);
  }
}

export function unfriend(userId: string, otherId: string): void {
  const row = findFriendship(userId, otherId);
  if (!row || row.status !== 'accepted') throw new HttpError(404, 'Friend not found');
  run(`DELETE FROM friendships WHERE id = ?`, [row.id]);
}

export function searchUsers(viewerId: string, query: string): Array<{ user: PublicUser; friendStatus: FriendStatus }> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const pattern = `%${trimmed.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const rows = all<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users
     WHERE id != ?
       AND (username LIKE ? ESCAPE '\\' COLLATE NOCASE OR display_name LIKE ? ESCAPE '\\' COLLATE NOCASE)
     ORDER BY username
     LIMIT 10`,
    [viewerId, pattern, pattern],
  );
  return rows.map((row) => {
    const status = friendStatus(viewerId, row.id);
    const visible = canViewContent(viewerId, row.id, row.is_public);
    return { user: toUser(row, [], visible), friendStatus: status };
  });
}

function reviewById(id: string): ReviewJson | undefined {
  const row = get<ReviewRow>(`${REVIEW_SELECT} WHERE r.id = ?`, [id]);
  return row ? toReview(row) : undefined;
}

function diaryById(id: string): DiaryJson | undefined {
  const row = get<DiaryRow>(`${DIARY_SELECT} WHERE d.id = ?`, [id]);
  return row ? toDiary(row) : undefined;
}

export function listDiary(userId: string): { entries: DiaryJson[]; reviews: ReviewJson[] } {
  const entries = all<DiaryRow>(
    `${DIARY_SELECT} WHERE d.user_id = ? ORDER BY d.logged_on DESC, d.created_at DESC`,
    [userId],
  ).map(toDiary);
  const reviews = all<ReviewRow>(
    `${REVIEW_SELECT} WHERE r.user_id = ? ORDER BY d.logged_on DESC, r.created_at DESC`,
    [userId],
  ).map(toReview);
  return { entries, reviews };
}

export function assertCanViewUser(viewerId: string, username: string): UserRow {
  const user = findUserByUsername(username);
  if (!user) throw new HttpError(404, 'User not found');
  if (!canViewContent(viewerId, user.id, user.is_public)) {
    throw new HttpError(403, 'This profile is private');
  }
  return user;
}

export function createDiary(
  userId: string,
  input: {
    media: MediaSnapshot;
    loggedOn: string;
    season: number | null;
    episode: number | null;
    musicKind: string | null;
    rating: number | null;
    review: { rating: number; body: string; tags: string[] } | null;
  },
): { entry: DiaryJson; review: ReviewJson | null } {
  const entryId = randomUUID();
  const reviewId = input.review ? randomUUID() : null;
  const createdAt = nowIso();
  const rating = input.review?.rating ?? input.rating;
  const musicKind = input.musicKind ?? input.media.musicKind;
  transaction(() => {
    run(
      `INSERT INTO diary_entries (
        id, user_id, media_id, media_type, title, subtitle, year, art_color, image_url,
        artist, album, genres_json, logged_on, season, episode, music_kind, rating, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entryId,
        userId,
        input.media.id,
        input.media.type,
        input.media.title,
        input.media.subtitle,
        input.media.year,
        input.media.artColor,
        input.media.imageUrl,
        input.media.artist,
        input.media.album,
        JSON.stringify(input.media.genres),
        input.loggedOn,
        input.season,
        input.episode,
        musicKind,
        rating,
        createdAt,
      ],
    );
    if (input.review && reviewId) {
      run(
        `INSERT INTO reviews (id, user_id, diary_entry_id, rating, body, tags_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [reviewId, userId, entryId, input.review.rating, input.review.body, JSON.stringify(input.review.tags), createdAt],
      );
    }
  });
  const entry = diaryById(entryId);
  if (!entry) throw new HttpError(500, 'Could not save diary entry');
  return { entry, review: reviewId ? reviewById(reviewId) ?? null : null };
}

export function deleteDiary(userId: string, entryId: string): void {
  const row = get<{ user_id: string }>(`SELECT user_id FROM diary_entries WHERE id = ?`, [entryId]);
  if (!row || row.user_id !== userId) throw new HttpError(404, 'Diary entry not found');
  run(`DELETE FROM diary_entries WHERE id = ?`, [entryId]);
}

export function addReview(
  userId: string,
  input: { diaryEntryId: string; rating: number; body: string; tags: string[] },
): ReviewJson {
  const entry = get<{ user_id: string }>(`SELECT user_id FROM diary_entries WHERE id = ?`, [input.diaryEntryId]);
  if (!entry || entry.user_id !== userId) throw new HttpError(404, 'Diary entry not found');
  const existing = get(`SELECT id FROM reviews WHERE diary_entry_id = ?`, [input.diaryEntryId]);
  if (existing) throw new HttpError(409, 'This entry already has a review');
  const id = randomUUID();
  const createdAt = nowIso();
  transaction(() => {
    run(
      `INSERT INTO reviews (id, user_id, diary_entry_id, rating, body, tags_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, input.diaryEntryId, input.rating, input.body, JSON.stringify(input.tags), createdAt],
    );
    run(`UPDATE diary_entries SET rating = ? WHERE id = ?`, [input.rating, input.diaryEntryId]);
  });
  const review = reviewById(id);
  if (!review) throw new HttpError(500, 'Could not save review');
  return review;
}

export function getVisibleReview(viewerId: string, reviewId: string): ReviewJson {
  const row = get<ReviewRow>(`${REVIEW_SELECT} WHERE r.id = ?`, [reviewId]);
  if (!row || !canViewContent(viewerId, row.user_id, row.is_public)) {
    throw new HttpError(404, 'Review not found');
  }
  return toReview(row);
}

export function listVisibleMediaReviews(viewerId: string, mediaId: string): ReviewJson[] {
  const friendIds = friendIdsFor(viewerId);
  const params: Array<string> = [mediaId, viewerId];
  let sql = `${REVIEW_SELECT} WHERE d.media_id = ? AND (r.user_id = ? OR u.is_public = 1`;
  if (friendIds.length > 0) {
    sql += ` OR r.user_id IN (${friendIds.map(() => '?').join(',')})`;
    params.push(...friendIds);
  }
  sql += `) ORDER BY r.created_at DESC`;
  return all<ReviewRow>(sql, params).map(toReview);
}

export function listComments(reviewId: string): CommentJson[] {
  return all<CommentRow>(
    `${COMMENT_SELECT} WHERE c.review_id = ? ORDER BY c.created_at ASC`,
    [reviewId],
  ).map(toComment);
}

export function addComment(userId: string, reviewId: string, body: string): CommentJson {
  getVisibleReview(userId, reviewId);
  const id = randomUUID();
  const createdAt = nowIso();
  run(
    `INSERT INTO comments (id, review_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, reviewId, userId, body, createdAt],
  );
  const row = get<CommentRow>(`${COMMENT_SELECT} WHERE c.id = ?`, [id]);
  if (!row) throw new HttpError(500, 'Could not save comment');
  return toComment(row);
}

export function listOwnComments(userId: string): CommentJson[] {
  return all<CommentRow>(
    `${COMMENT_SELECT} WHERE c.user_id = ? ORDER BY c.created_at DESC`,
    [userId],
  ).map(toComment);
}

export function feed(viewerId: string, mediaType?: string): {
  activities: Array<{
    id: string;
    kind: 'review' | 'comment';
    userId: string;
    reviewId: string;
    mediaType: string;
    createdAt: string;
    commentId?: string;
  }>;
  reviews: ReviewJson[];
  comments: CommentJson[];
} {
  const friendIds = friendIdsFor(viewerId);
  if (friendIds.length === 0) return { activities: [], reviews: [], comments: [] };
  const placeholders = friendIds.map(() => '?').join(',');
  const reviewRows = all<ReviewRow>(
    `${REVIEW_SELECT} WHERE r.user_id IN (${placeholders}) ORDER BY r.created_at DESC`,
    friendIds,
  );
  const commentRows = all<CommentRow & { review_author_id: string; media_type: string }>(
    `${COMMENT_SELECT.replace(
      'd.title AS media_title',
      'd.title AS media_title, r.user_id AS review_author_id, d.media_type AS media_type',
    )}
     WHERE c.user_id IN (${placeholders})
     ORDER BY c.created_at DESC`,
    friendIds,
  ).filter((row) => canViewContent(viewerId, row.review_author_id, row.review_author_public));

  const reviews = reviewRows.map(toReview);
  const known = new Set(reviews.map((review) => review.id));
  const extraIds = [...new Set(commentRows.map((row) => row.review_id))].filter((id) => !known.has(id));
  if (extraIds.length > 0) {
    const extra = all<ReviewRow>(
      `${REVIEW_SELECT} WHERE r.id IN (${extraIds.map(() => '?').join(',')})`,
      extraIds,
    ).map(toReview);
    reviews.push(...extra);
  }

  const comments = commentRows.map(toComment);
  const activities = [
    ...reviewRows.map((row) => ({
      id: `feed-rev-${row.id}`,
      kind: 'review' as const,
      userId: row.user_id,
      reviewId: row.id,
      mediaType: row.media_type,
      createdAt: row.created_at,
    })),
    ...commentRows.map((row) => ({
      id: `feed-cmt-${row.id}`,
      kind: 'comment' as const,
      userId: row.user_id,
      reviewId: row.review_id,
      commentId: row.id,
      mediaType: row.media_type,
      createdAt: row.created_at,
    })),
  ]
    .filter((activity) => !mediaType || activity.mediaType === mediaType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { activities, reviews, comments };
}

export interface MediaListJson {
  id: string;
  userId: string;
  name: string;
  kind: ListRow['kind'];
  mediaIds: string[];
}

export function listsFor(userId: string): MediaListJson[] {
  return all<ListRow>(`SELECT * FROM lists WHERE user_id = ?`, [userId]).map((list) => ({
    id: list.id,
    userId: list.user_id,
    name: list.name,
    kind: list.kind,
    mediaIds: all<{ media_id: string }>(
      `SELECT media_id FROM list_items WHERE list_id = ? ORDER BY added_at`,
      [list.id],
    ).map((item) => item.media_id),
  }));
}

export function addToList(userId: string, media: MediaSnapshot): { list: MediaListJson; added: boolean } {
  const kind: ListRow['kind'] =
    media.type === 'book' ? 'to-read' : media.type === 'music' ? 'to-listen' : 'to-watch';
  const list = get<ListRow>(`SELECT * FROM lists WHERE user_id = ? AND kind = ?`, [userId, kind]);
  if (!list) throw new HttpError(404, 'List not found');
  const existing = get(`SELECT 1 AS ok FROM list_items WHERE list_id = ? AND media_id = ?`, [
    list.id,
    media.id,
  ]);
  if (!existing) {
    run(`INSERT INTO list_items (list_id, media_id, added_at) VALUES (?, ?, ?)`, [
      list.id,
      media.id,
      nowIso(),
    ]);
  }
  const serialized = listsFor(userId).find((item) => item.id === list.id);
  if (!serialized) throw new HttpError(500, 'Could not update list');
  return { list: serialized, added: !existing };
}

export function removeFromList(userId: string, mediaId: string): void {
  run(
    `DELETE FROM list_items WHERE media_id = ? AND list_id IN (SELECT id FROM lists WHERE user_id = ?)`,
    [mediaId, userId],
  );
}

type TopFivePayload = {
  mode: TopMode;
  slotsByMode: Record<TopMode, TopSlot[]>;
};

const EMPTY_SLOTS_BY_MODE = (): Record<TopMode, TopSlot[]> => ({
  mixed: [],
  movie: [],
  show: [],
  book: [],
  music: [],
});

function isTopSlot(value: unknown): value is TopSlot {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as TopSlot).mediaId === 'string' &&
    typeof (value as TopSlot).rank === 'number'
  );
}

function mediaTypeFromId(mediaId: string): TopMode | undefined {
  if (mediaId.includes('show') || mediaId.startsWith('tmdb-show-')) return 'show';
  if (mediaId.includes('book') || mediaId.startsWith('ol-book-')) return 'book';
  if (mediaId.includes('music') || mediaId.startsWith('spotify-')) return 'music';
  if (mediaId.includes('movie') || mediaId.startsWith('tmdb-movie-')) return 'movie';
  return undefined;
}

function parseSlotList(value: unknown): TopSlot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTopSlot).slice(0, 5);
}

function migrateLegacySlots(slots: TopSlot[]): Record<TopMode, TopSlot[]> {
  const byMode = EMPTY_SLOTS_BY_MODE();
  for (const slot of slots) {
    const type = mediaTypeFromId(slot.mediaId);
    if (!type || type === 'mixed') continue;
    if (byMode[type].length >= 5) continue;
    byMode[type].push({ mediaId: slot.mediaId, rank: byMode[type].length + 1 });
  }
  // Best-effort mixed list from legacy shared slots (up to 5).
  byMode.mixed = slots.slice(0, 5).map((slot, index) => ({
    mediaId: slot.mediaId,
    rank: index + 1,
  }));
  return byMode;
}

export function topFiveFor(userId: string): TopFivePayload {
  const row = get<{ mode: string; slots_json: string; slots_by_mode_json: string | null }>(
    `SELECT mode, slots_json, slots_by_mode_json FROM top_five WHERE user_id = ?`,
    [userId],
  );
  if (!row) return { mode: 'mixed', slotsByMode: EMPTY_SLOTS_BY_MODE() };
  const mode = (['mixed', 'movie', 'show', 'book', 'music'] as const).includes(row.mode as TopMode)
    ? (row.mode as TopMode)
    : 'mixed';

  let slotsByMode = EMPTY_SLOTS_BY_MODE();
  let parsedModes: unknown;
  try {
    parsedModes = row.slots_by_mode_json ? JSON.parse(row.slots_by_mode_json) : null;
  } catch {
    parsedModes = null;
  }

  if (parsedModes && typeof parsedModes === 'object' && !Array.isArray(parsedModes)) {
    const record = parsedModes as Record<string, unknown>;
    for (const key of ['mixed', 'movie', 'show', 'book', 'music'] as const) {
      slotsByMode[key] = parseSlotList(record[key]);
    }
  } else {
    let legacy: TopSlot[] = [];
    try {
      const parsed = JSON.parse(row.slots_json) as unknown;
      legacy = parseSlotList(parsed);
    } catch {
      legacy = [];
    }
    slotsByMode = migrateLegacySlots(legacy);
    run(`UPDATE top_five SET slots_by_mode_json = ? WHERE user_id = ?`, [
      JSON.stringify(slotsByMode),
      userId,
    ]);
  }

  return { mode, slotsByMode };
}

export function updateTopFive(
  userId: string,
  mode: TopMode,
  slots?: TopSlot[],
): TopFivePayload {
  const current = topFiveFor(userId);
  if (slots) {
    const next = { ...current.slotsByMode, [mode]: parseSlotList(slots) };
    run(`UPDATE top_five SET mode = ?, slots_by_mode_json = ?, slots_json = ? WHERE user_id = ?`, [
      mode,
      JSON.stringify(next),
      JSON.stringify(next[mode]),
      userId,
    ]);
  } else {
    run(`UPDATE top_five SET mode = ? WHERE user_id = ?`, [mode, userId]);
  }
  return topFiveFor(userId);
}

export function setUserAvatarUrl(userId: string, avatarUrl: string | null): UserRow {
  run(`UPDATE users SET avatar_url = ? WHERE id = ?`, [avatarUrl, userId]);
  const user = findUserById(userId);
  if (!user) throw new HttpError(404, 'Account not found');
  return user;
}

export function accountPayload(userId: string) {
  const user = findUserById(userId);
  if (!user) throw new HttpError(401, 'Unauthorized');
  const friends = listFriends(userId);
  const requests = listRequests(userId);
  return {
    user: { ...toUser(user, friends.map((friend) => friend.id), true), email: user.email },
    friends,
    incomingRequests: requests.incoming,
    outgoingRequests: requests.outgoing,
    lists: listsFor(userId),
    topFive: topFiveFor(userId),
  };
}
