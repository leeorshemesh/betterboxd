import { get, run } from './db.js';
import { hashPassword } from './passwords.js';
import {
  addComment,
  createDiary,
  findUserByUsername,
  insertUser,
  seedAcceptedFriendship,
} from './repos.js';
import type { MediaSnapshot } from './validate.js';

const SEED_PASSWORD = 'password';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342';

/** Stable poster/cover URLs for demo diary rows (public CDNs). */
const SEED_ART: Record<string, string> = {
  'movie-parasite': `${TMDB_POSTER}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
  'movie-arrival': `${TMDB_POSTER}/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg`,
  'movie-dune': `${TMDB_POSTER}/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg`,
  'show-severance': `${TMDB_POSTER}/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg`,
  'show-bear': `${TMDB_POSTER}/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg`,
  'book-klara': 'https://covers.openlibrary.org/b/id/10648686-M.jpg',
};

const SEED_USERS = [
  {
    id: 'user-maya',
    email: 'maya@betterboxd.local',
    username: 'maya_reels',
    displayName: 'Maya Chen',
    avatarColor: '#2A3A4A',
    avatarInitials: 'MC',
    bio: 'Film school dropout turned critic.',
    isPublic: true,
  },
  {
    id: 'user-jordan',
    email: 'jordan@betterboxd.local',
    username: 'j.watches',
    displayName: 'Jordan Park',
    avatarColor: '#4A2A3A',
    avatarInitials: 'JP',
    bio: 'TV first, movies second.',
    isPublic: false,
  },
  {
    id: 'user-sam',
    email: 'sam@betterboxd.local',
    username: 'samreads',
    displayName: 'Sam Okonkwo',
    avatarColor: '#3A2A1A',
    avatarInitials: 'SO',
    bio: 'Books & deep cuts.',
    isPublic: true,
  },
] as const;

function media(
  partial: Pick<MediaSnapshot, 'id' | 'type' | 'title' | 'artColor'> &
    Partial<Omit<MediaSnapshot, 'id' | 'type' | 'title' | 'artColor'>>,
): MediaSnapshot {
  return {
    subtitle: partial.subtitle ?? null,
    year: partial.year ?? null,
    genres: partial.genres ?? [],
    imageUrl: partial.imageUrl ?? SEED_ART[partial.id] ?? null,
    artist: partial.artist ?? null,
    album: partial.album ?? null,
    musicKind: partial.musicKind ?? null,
    id: partial.id,
    type: partial.type,
    title: partial.title,
    artColor: partial.artColor,
  };
}

async function ensureUser(seed: (typeof SEED_USERS)[number]): Promise<string> {
  const existing = findUserByUsername(seed.username);
  if (existing) return existing.id;
  const created = insertUser({
    ...seed,
    passwordHash: await hashPassword(SEED_PASSWORD),
  });
  return created.id;
}

function hasDiary(userId: string): boolean {
  return Boolean(get(`SELECT 1 AS ok FROM diary_entries WHERE user_id = ? LIMIT 1`, [userId]));
}

/** Fill missing posters on already-seeded diary rows (idempotent). */
function backfillSeedArt(): void {
  for (const [mediaId, imageUrl] of Object.entries(SEED_ART)) {
    run(
      `UPDATE diary_entries
       SET image_url = ?
       WHERE media_id = ? AND (image_url IS NULL OR image_url = '')`,
      [imageUrl, mediaId],
    );
  }
}

function seedDiaryContent(mayaId: string, jordanId: string, samId: string): void {
  if (hasDiary(mayaId) || hasDiary(jordanId) || hasDiary(samId)) return;

  const mayaParasite = createDiary(mayaId, {
    media: media({
      id: 'movie-parasite',
      type: 'movie',
      title: 'Parasite',
      subtitle: 'Bong Joon-ho',
      year: 2019,
      genres: ['thriller', 'drama', 'dark comedy'],
      artColor: '#3D1F1F',
    }),
    loggedOn: '2024-11-02',
    season: null,
    episode: null,
    musicKind: null,
    rating: 5,
    review: {
      rating: 5,
      body: 'Class warfare with a staircase. Still thinking about the peach scene.',
      tags: ['rewatch', 'favorite'],
    },
  });

  createDiary(mayaId, {
    media: media({
      id: 'movie-arrival',
      type: 'movie',
      title: 'Arrival',
      subtitle: 'Denis Villeneuve',
      year: 2016,
      genres: ['sci-fi', 'drama'],
      artColor: '#1A2A3A',
    }),
    loggedOn: '2024-10-18',
    season: null,
    episode: null,
    musicKind: null,
    rating: 4.5,
    review: {
      rating: 4.5,
      body: 'Language as time travel. Quiet and devastating.',
      tags: ['sci-fi'],
    },
  });

  const jordanSeverance = createDiary(jordanId, {
    media: media({
      id: 'show-severance',
      type: 'show',
      title: 'Severance',
      subtitle: 'Dan Erickson',
      year: 2022,
      genres: ['thriller', 'sci-fi', 'drama'],
      artColor: '#2A2A2A',
    }),
    loggedOn: '2024-11-05',
    season: 2,
    episode: 4,
    musicKind: null,
    rating: 5,
    review: {
      rating: 5,
      body: 'The office horror I did not know I needed. Private watch party recommended.',
      tags: ['binge'],
    },
  });

  createDiary(jordanId, {
    media: media({
      id: 'show-bear',
      type: 'show',
      title: 'The Bear',
      subtitle: 'Christopher Storer',
      year: 2022,
      genres: ['comedy', 'drama'],
      artColor: '#3A1A1A',
    }),
    loggedOn: '2024-09-22',
    season: 3,
    episode: 1,
    musicKind: null,
    rating: 4,
    review: {
      rating: 4,
      body: 'Stress as art direction. Yes, chef.',
      tags: ['comfort'],
    },
  });

  const samKlara = createDiary(samId, {
    media: media({
      id: 'book-klara',
      type: 'book',
      title: 'Klara and the Sun',
      subtitle: 'Kazuo Ishiguro',
      year: 2021,
      genres: ['literary', 'sci-fi'],
      artColor: '#2A3A2A',
    }),
    loggedOn: '2024-10-28',
    season: null,
    episode: null,
    musicKind: null,
    rating: 4.5,
    review: {
      rating: 4.5,
      body: 'Tender and eerie. The sun as religion still gets me.',
      tags: ['literary'],
    },
  });

  createDiary(samId, {
    media: media({
      id: 'music-blonde',
      type: 'music',
      title: 'Blonde',
      subtitle: 'Frank Ocean',
      year: 2016,
      genres: ['r&b', 'experimental'],
      artColor: '#2A1A2A',
      artist: 'Frank Ocean',
      album: 'Blonde',
      musicKind: 'album',
    }),
    loggedOn: '2024-08-14',
    season: null,
    episode: null,
    musicKind: 'album',
    rating: 5,
    review: {
      rating: 5,
      body: 'Nights on loop. Still the album I measure others against.',
      tags: ['album'],
    },
  });

  createDiary(mayaId, {
    media: media({
      id: 'movie-dune',
      type: 'movie',
      title: 'Dune: Part Two',
      subtitle: 'Denis Villeneuve',
      year: 2024,
      genres: ['sci-fi', 'adventure'],
      artColor: '#3A2E1A',
    }),
    loggedOn: '2024-11-10',
    season: null,
    episode: null,
    musicKind: null,
    rating: 4,
    review: null,
  });

  if (mayaParasite.review) {
    addComment(jordanId, mayaParasite.review.id, 'The peach scene ruined fruit for me. Perfect.');
  }
  if (jordanSeverance.review) {
    addComment(mayaId, jordanSeverance.review.id, 'Come over next week — we are finishing S2.');
    addComment(samId, jordanSeverance.review.id, 'I am not friends with Jordan enough for spoilers… waiting.');
  }
  if (samKlara.review) {
    addComment(jordanId, samKlara.review.id, 'Adding this to my list. Ishiguro never misses.');
  }
}

/** Local demo accounts so friend requests can be tried. Password is `password`. */
export async function seed(): Promise<void> {
  const mayaId = await ensureUser(SEED_USERS[0]);
  const jordanId = await ensureUser(SEED_USERS[1]);
  const samId = await ensureUser(SEED_USERS[2]);
  seedAcceptedFriendship(mayaId, jordanId);
  seedAcceptedFriendship(jordanId, samId);
  seedDiaryContent(mayaId, jordanId, samId);
  backfillSeedArt();
}
