import { hashPassword } from './passwords.js';
import { findUserByUsername, insertUser, seedAcceptedFriendship } from './repos.js';

const SEED_PASSWORD = 'password';

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

async function ensureUser(seed: (typeof SEED_USERS)[number]): Promise<string> {
  const existing = findUserByUsername(seed.username);
  if (existing) return existing.id;
  const created = insertUser({
    ...seed,
    passwordHash: await hashPassword(SEED_PASSWORD),
  });
  return created.id;
}

/** Local demo accounts so friend requests can be tried. Password is `password`. */
export async function seed(): Promise<void> {
  const mayaId = await ensureUser(SEED_USERS[0]);
  const jordanId = await ensureUser(SEED_USERS[1]);
  const samId = await ensureUser(SEED_USERS[2]);
  seedAcceptedFriendship(mayaId, jordanId);
  seedAcceptedFriendship(jordanId, samId);
}
