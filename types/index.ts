export type MediaType = 'movie' | 'show' | 'book' | 'music';

export type MusicTargetKind = 'song' | 'album' | 'artist';

export type FeedFilter = 'all' | MediaType;

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  subtitle?: string;
  year?: number;
  genres: string[];
  /** Placeholder art color / gradient seed when no image URL */
  artColor: string;
  imageUrl?: string;
  /** Shows only */
  seasons?: number;
  episodesPerSeason?: number;
  /** Music only */
  artist?: string;
  album?: string;
  musicKind?: MusicTargetKind;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
  bio?: string;
  isPublic: boolean;
  friendIds: string[];
}

export interface ReviewTarget {
  mediaId: string;
  /** Shows: optional season / episode targeting */
  season?: number;
  episode?: number;
  /** Music: song | album | artist */
  musicKind?: MusicTargetKind;
}

export interface Review {
  id: string;
  userId: string;
  target: ReviewTarget;
  mediaType: MediaType;
  rating: number; // 0.5–5 in half-star steps
  body: string;
  tags: string[];
  createdAt: string; // ISO
  interactionCount: number;
}

export interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  body: string;
  createdAt: string;
  /** Visible when the review author's profile is public, or to friends when private */
  visibilityNote?: string;
}

export interface MediaList {
  id: string;
  userId: string;
  name: string;
  kind: 'to-watch' | 'to-read' | 'to-listen' | 'custom';
  mediaIds: string[];
}

export type TopFiveMode = 'mixed' | MediaType;

export interface TopFiveSlot {
  mediaId: string;
  rank: number;
}

export interface TopFiveConfig {
  mode: TopFiveMode;
  /** When mode is mixed: one per type. When typed: up to five of that type. */
  slots: TopFiveSlot[];
}

export type FeedActivityKind = 'review' | 'comment';

export interface FeedActivity {
  id: string;
  kind: FeedActivityKind;
  userId: string;
  reviewId: string;
  mediaType: MediaType;
  createdAt: string;
  /** For comment activities */
  commentId?: string;
}
