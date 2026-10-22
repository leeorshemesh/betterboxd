import type { TopFiveConfig, User } from '@/types';

/** Current logged-in user (mock auth — swap for real session later). */
export const CURRENT_USER_ID = 'user-leeor';

export const mockUsers: User[] = [
  {
    id: 'user-leeor',
    username: 'leeor',
    displayName: 'Leeor',
    avatarColor: '#3A4A2A',
    avatarInitials: 'LE',
    bio: 'Watching, reading, listening — logging it all.',
    isPublic: true,
    friendIds: ['user-maya', 'user-jordan', 'user-sam'],
  },
  {
    id: 'user-maya',
    username: 'maya_reels',
    displayName: 'Maya Chen',
    avatarColor: '#2A3A4A',
    avatarInitials: 'MC',
    bio: 'Film school dropout turned critic.',
    isPublic: true,
    friendIds: ['user-leeor', 'user-jordan'],
  },
  {
    id: 'user-jordan',
    username: 'j.watches',
    displayName: 'Jordan Park',
    avatarColor: '#4A2A3A',
    avatarInitials: 'JP',
    bio: 'TV first, movies second.',
    isPublic: false,
    friendIds: ['user-leeor', 'user-maya', 'user-sam'],
  },
  {
    id: 'user-sam',
    username: 'samreads',
    displayName: 'Sam Okonkwo',
    avatarColor: '#3A2A1A',
    avatarInitials: 'SO',
    bio: 'Books & deep cuts.',
    isPublic: true,
    friendIds: ['user-leeor', 'user-jordan'],
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getCurrentUser(): User {
  return mockUsers.find((u) => u.id === CURRENT_USER_ID)!;
}

export function getFriends(userId: string = CURRENT_USER_ID): User[] {
  const user = getUserById(userId);
  if (!user) return [];
  return user.friendIds.map(getUserById).filter(Boolean) as User[];
}

/** Default Top Five for the current user — one of each type. */
export const defaultTopFive: TopFiveConfig = {
  mode: 'mixed',
  slots: [
    { mediaId: 'music-nights', rank: 1 },
    { mediaId: 'show-succession', rank: 2 },
    { mediaId: 'movie-parasite', rank: 3 },
    { mediaId: 'book-piranesi', rank: 4 },
  ],
};

export const topFiveByType: Record<string, TopFiveConfig> = {
  movie: {
    mode: 'movie',
    slots: [
      { mediaId: 'movie-parasite', rank: 1 },
      { mediaId: 'movie-arrival', rank: 2 },
      { mediaId: 'movie-portrait', rank: 3 },
      { mediaId: 'movie-aftersun', rank: 4 },
      { mediaId: 'movie-everything', rank: 5 },
    ],
  },
  show: {
    mode: 'show',
    slots: [
      { mediaId: 'show-succession', rank: 1 },
      { mediaId: 'show-severance', rank: 2 },
      { mediaId: 'show-andor', rank: 3 },
      { mediaId: 'show-bear', rank: 4 },
      { mediaId: 'show-shogun', rank: 5 },
    ],
  },
  book: {
    mode: 'book',
    slots: [
      { mediaId: 'book-piranesi', rank: 1 },
      { mediaId: 'book-klara', rank: 2 },
      { mediaId: 'book-tomorrow', rank: 3 },
      { mediaId: 'book-project-hail-mary', rank: 4 },
      { mediaId: 'book-martian', rank: 5 },
    ],
  },
  music: {
    mode: 'music',
    slots: [
      { mediaId: 'music-nights', rank: 1 },
      { mediaId: 'music-blonde', rank: 2 },
      { mediaId: 'music-venice', rank: 3 },
      { mediaId: 'music-ok-computer', rank: 4 },
      { mediaId: 'music-renaissance', rank: 5 },
    ],
  },
};
