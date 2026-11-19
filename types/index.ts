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
  /** Per-season episode counts keyed by season number (stringified). */
  episodesBySeason?: Record<string, number>;
  /** Optional popularity signal from provider (higher = more popular). */
  popularity?: number;
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
  avatarUrl?: string | null;
  bio?: string;
  isPublic: boolean;
  friendIds: string[];
  /** Present on the signed-in account only. */
  email?: string;
}

export type FriendStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends' | 'self';

export interface FriendRequest {
  id: string;
  user: User;
  createdAt: string;
}

export interface UserSearchHit {
  user: User;
  friendStatus: FriendStatus;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  media: MediaItem;
  loggedOn: string;
  season?: number;
  episode?: number;
  musicKind?: MusicTargetKind;
  rating?: number;
  createdAt: string;
  reviewId?: string;
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
  diaryEntryId?: string;
  target: ReviewTarget;
  mediaType: MediaType;
  media?: MediaItem;
  author?: User;
  rating: number; // 0.5–5 in half-star steps
  body: string;
  tags: string[];
  createdAt: string; // ISO
  /** Diary date (YYYY-MM-DD) when this review was logged. */
  loggedOn?: string;
  interactionCount: number;
}

export interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  body: string;
  createdAt: string;
  author?: User;
  mediaTitle?: string;
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
  /** Independent curated lists per mode. Mixed is its own top five. */
  slotsByMode: Record<TopFiveMode, TopFiveSlot[]>;
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
