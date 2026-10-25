export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
  bio?: string;
  isPublic: boolean;
  friendIds: string[];
  /** Present only on the signed-in account. */
  email?: string;
}

export interface MediaJson {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  year?: number;
  genres: string[];
  artColor: string;
  imageUrl?: string;
  artist?: string;
  album?: string;
  musicKind?: string;
}

export interface DiaryJson {
  id: string;
  userId: string;
  media: MediaJson;
  loggedOn: string;
  season?: number;
  episode?: number;
  musicKind?: string;
  rating?: number;
  createdAt: string;
  reviewId?: string;
}

export interface ReviewJson {
  id: string;
  userId: string;
  diaryEntryId: string;
  target: { mediaId: string; season?: number; episode?: number; musicKind?: string };
  mediaType: string;
  media: MediaJson;
  author: PublicUser;
  rating: number;
  body: string;
  tags: string[];
  createdAt: string;
  loggedOn: string;
  interactionCount: number;
}

export interface CommentJson {
  id: string;
  reviewId: string;
  userId: string;
  body: string;
  createdAt: string;
  author: PublicUser;
  mediaTitle?: string;
  visibilityNote?: string;
}

export interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  display_name: string;
  avatar_color: string;
  avatar_initials: string;
  bio: string | null;
  is_public: number;
  created_at: string;
}

export interface DiaryRow {
  id: string;
  user_id: string;
  media_id: string;
  media_type: string;
  title: string;
  subtitle: string | null;
  year: number | null;
  art_color: string;
  image_url: string | null;
  artist: string | null;
  album: string | null;
  genres_json: string;
  logged_on: string;
  season: number | null;
  episode: number | null;
  music_kind: string | null;
  rating: number | null;
  created_at: string;
  review_id: string | null;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  diary_entry_id: string;
  rating: number;
  body: string;
  tags_json: string;
  created_at: string;
  media_id: string;
  media_type: string;
  title: string;
  subtitle: string | null;
  year: number | null;
  art_color: string;
  image_url: string | null;
  artist: string | null;
  album: string | null;
  genres_json: string;
  logged_on: string;
  season: number | null;
  episode: number | null;
  music_kind: string | null;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_initials: string;
  bio: string | null;
  is_public: number;
  interaction_count: number;
}

export interface CommentRow {
  id: string;
  review_id: string;
  user_id: string;
  body: string;
  created_at: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_initials: string;
  bio: string | null;
  is_public: number;
  review_author_public: number;
  media_title: string;
}

export function stringList(json: string): string[] {
  try {
    const value = JSON.parse(json) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function toUser(row: UserRow, friendIds: string[] = [], includeBio = true): PublicUser {
  const user: PublicUser = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    avatarInitials: row.avatar_initials,
    isPublic: row.is_public === 1,
    friendIds,
  };
  if (includeBio && row.bio) user.bio = row.bio;
  return user;
}

function mediaFrom(row: {
  media_id: string;
  media_type: string;
  title: string;
  subtitle: string | null;
  year: number | null;
  art_color: string;
  image_url: string | null;
  artist: string | null;
  album: string | null;
  genres_json: string;
  music_kind: string | null;
}): MediaJson {
  const media: MediaJson = {
    id: row.media_id,
    type: row.media_type,
    title: row.title,
    genres: stringList(row.genres_json),
    artColor: row.art_color,
  };
  if (row.subtitle) media.subtitle = row.subtitle;
  if (row.year != null) media.year = row.year;
  if (row.image_url) media.imageUrl = row.image_url;
  if (row.artist) media.artist = row.artist;
  if (row.album) media.album = row.album;
  if (row.music_kind) media.musicKind = row.music_kind;
  return media;
}

export function toDiary(row: DiaryRow): DiaryJson {
  const entry: DiaryJson = {
    id: row.id,
    userId: row.user_id,
    media: mediaFrom(row),
    loggedOn: row.logged_on,
    createdAt: row.created_at,
  };
  if (row.season != null) entry.season = row.season;
  if (row.episode != null) entry.episode = row.episode;
  if (row.music_kind) entry.musicKind = row.music_kind;
  if (row.rating != null) entry.rating = row.rating;
  if (row.review_id) entry.reviewId = row.review_id;
  return entry;
}

export function toReview(row: ReviewRow): ReviewJson {
  const author = toUser(
    {
      id: row.user_id,
      email: '',
      username: row.username,
      password_hash: '',
      display_name: row.display_name,
      avatar_color: row.avatar_color,
      avatar_initials: row.avatar_initials,
      bio: row.bio,
      is_public: row.is_public,
      created_at: row.created_at,
    },
    [],
    true,
  );
  const review: ReviewJson = {
    id: row.id,
    userId: row.user_id,
    diaryEntryId: row.diary_entry_id,
    target: { mediaId: row.media_id },
    mediaType: row.media_type,
    media: mediaFrom(row),
    author,
    rating: row.rating,
    body: row.body,
    tags: stringList(row.tags_json),
    createdAt: row.created_at,
    loggedOn: row.logged_on,
    interactionCount: row.interaction_count,
  };
  if (row.season != null) review.target.season = row.season;
  if (row.episode != null) review.target.episode = row.episode;
  if (row.music_kind) review.target.musicKind = row.music_kind;
  return review;
}

export function toComment(row: CommentRow): CommentJson {
  const comment: CommentJson = {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    author: toUser(
      {
        id: row.user_id,
        email: '',
        username: row.username,
        password_hash: '',
        display_name: row.display_name,
        avatar_color: row.avatar_color,
        avatar_initials: row.avatar_initials,
        bio: row.bio,
        is_public: row.is_public,
        created_at: row.created_at,
      },
      [],
      false,
    ),
    mediaTitle: row.media_title,
  };
  if (row.review_author_public === 0) {
    comment.visibilityNote = 'Private profile — comments are visible to friends.';
  }
  return comment;
}
