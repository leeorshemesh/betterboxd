CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  bio TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE friendships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE TABLE diary_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  year INTEGER,
  art_color TEXT NOT NULL,
  image_url TEXT,
  artist TEXT,
  album TEXT,
  genres_json TEXT NOT NULL DEFAULT '[]',
  logged_on TEXT NOT NULL,
  season INTEGER,
  episode INTEGER,
  music_kind TEXT,
  rating REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diary_entry_id TEXT NOT NULL UNIQUE REFERENCES diary_entries(id) ON DELETE CASCADE,
  rating REAL NOT NULL,
  body TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  UNIQUE (user_id, kind)
);

CREATE TABLE list_items (
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (list_id, media_id)
);

CREATE TABLE top_five (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  slots_json TEXT NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_friend_requester ON friendships(requester_id, status);
CREATE INDEX idx_friend_addressee ON friendships(addressee_id, status);
CREATE INDEX idx_diary_user ON diary_entries(user_id, logged_on);
CREATE INDEX idx_diary_media ON diary_entries(media_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_comments_review ON comments(review_id);
CREATE INDEX idx_comments_user ON comments(user_id);
