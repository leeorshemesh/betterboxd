import type { MediaItem } from '@/types';

const TMDB = 'https://image.tmdb.org/t/p/w342';

export const mockCatalog: MediaItem[] = [
  // Movies
  {
    id: 'movie-parasite',
    type: 'movie',
    title: 'Parasite',
    subtitle: 'Bong Joon-ho',
    year: 2019,
    genres: ['thriller', 'drama', 'dark comedy'],
    artColor: '#3D1F1F',
    imageUrl: `${TMDB}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
  },
  {
    id: 'movie-arrival',
    type: 'movie',
    title: 'Arrival',
    subtitle: 'Denis Villeneuve',
    year: 2016,
    genres: ['sci-fi', 'drama'],
    artColor: '#1A2A3A',
    imageUrl: `${TMDB}/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg`,
  },
  {
    id: 'movie-portrait',
    type: 'movie',
    title: 'Portrait of a Lady on Fire',
    subtitle: 'Céline Sciamma',
    year: 2019,
    genres: ['romance', 'drama', 'period'],
    artColor: '#4A2C1A',
    imageUrl: `${TMDB}/2LquGwEhbg3soxSCs9VNyh5VJd9.jpg`,
  },
  {
    id: 'movie-everything',
    type: 'movie',
    title: 'Everything Everywhere All at Once',
    subtitle: 'Daniels',
    year: 2022,
    genres: ['sci-fi', 'comedy', 'action'],
    artColor: '#2A1A3A',
    imageUrl: `${TMDB}/u68AjlvlutfEIcpmbYpKcdi09ut.jpg`,
  },
  {
    id: 'movie-dune',
    type: 'movie',
    title: 'Dune: Part Two',
    subtitle: 'Denis Villeneuve',
    year: 2024,
    genres: ['sci-fi', 'adventure'],
    artColor: '#3A2E1A',
    imageUrl: `${TMDB}/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg`,
  },
  {
    id: 'movie-aftersun',
    type: 'movie',
    title: 'Aftersun',
    subtitle: 'Charlotte Wells',
    year: 2022,
    genres: ['drama'],
    artColor: '#1A3A3A',
    imageUrl: `${TMDB}/evKz85EKouVbIr51zy5fOtpNRPg.jpg`,
  },

  // Shows
  {
    id: 'show-succession',
    type: 'show',
    title: 'Succession',
    subtitle: 'Jesse Armstrong',
    year: 2018,
    genres: ['drama', 'dark comedy'],
    artColor: '#1F2A1F',
    seasons: 4,
    episodesPerSeason: 10,
    imageUrl: `${TMDB}/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg`,
  },
  {
    id: 'show-andor',
    type: 'show',
    title: 'Andor',
    subtitle: 'Tony Gilroy',
    year: 2022,
    genres: ['sci-fi', 'thriller'],
    artColor: '#1A1A2A',
    seasons: 2,
    episodesPerSeason: 12,
    imageUrl: `${TMDB}/khZqmwHQicTYoS7Flreb9EddFZC.jpg`,
  },
  {
    id: 'show-bear',
    type: 'show',
    title: 'The Bear',
    subtitle: 'Christopher Storer',
    year: 2022,
    genres: ['comedy', 'drama'],
    artColor: '#3A1A1A',
    seasons: 3,
    episodesPerSeason: 10,
    imageUrl: `${TMDB}/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg`,
  },
  {
    id: 'show-severance',
    type: 'show',
    title: 'Severance',
    subtitle: 'Dan Erickson',
    year: 2022,
    genres: ['thriller', 'sci-fi', 'drama'],
    artColor: '#2A2A2A',
    seasons: 2,
    episodesPerSeason: 10,
    imageUrl: `${TMDB}/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg`,
  },
  {
    id: 'show-shogun',
    type: 'show',
    title: 'Shōgun',
    subtitle: 'Rachel Kondo & Justin Marks',
    year: 2024,
    genres: ['drama', 'historical', 'adventure'],
    artColor: '#3A2020',
    seasons: 1,
    episodesPerSeason: 10,
    imageUrl: `${TMDB}/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg`,
  },

  // Books
  {
    id: 'book-klara',
    type: 'book',
    title: 'Klara and the Sun',
    subtitle: 'Kazuo Ishiguro',
    year: 2021,
    genres: ['literary', 'sci-fi'],
    artColor: '#2A3A2A',
    imageUrl: 'https://covers.openlibrary.org/b/id/10648686-M.jpg',
  },
  {
    id: 'book-project-hail-mary',
    type: 'book',
    title: 'Project Hail Mary',
    subtitle: 'Andy Weir',
    year: 2021,
    genres: ['sci-fi', 'adventure'],
    artColor: '#1A2A3A',
  },
  {
    id: 'book-tomorrow',
    type: 'book',
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    subtitle: 'Gabrielle Zevin',
    year: 2022,
    genres: ['literary', 'friendship'],
    artColor: '#3A2A1A',
  },
  {
    id: 'book-piranesi',
    type: 'book',
    title: 'Piranesi',
    subtitle: 'Susanna Clarke',
    year: 2020,
    genres: ['fantasy', 'literary'],
    artColor: '#1A2A2A',
  },
  {
    id: 'book-martian',
    type: 'book',
    title: 'The Martian',
    subtitle: 'Andy Weir',
    year: 2011,
    genres: ['sci-fi', 'adventure'],
    artColor: '#3A2A1A',
  },

  // Music
  {
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
  },
  {
    id: 'music-nights',
    type: 'music',
    title: 'Nights',
    subtitle: 'Frank Ocean',
    year: 2016,
    genres: ['r&b'],
    artColor: '#2A1A2A',
    artist: 'Frank Ocean',
    album: 'Blonde',
    musicKind: 'song',
  },
  {
    id: 'music-norman',
    type: 'music',
    title: 'Norman Fucking Rockwell!',
    subtitle: 'Lana Del Rey',
    year: 2019,
    genres: ['alt-pop', 'singer-songwriter'],
    artColor: '#3A2A2A',
    artist: 'Lana Del Rey',
    album: 'Norman Fucking Rockwell!',
    musicKind: 'album',
  },
  {
    id: 'music-venice',
    type: 'music',
    title: 'Venice Bitch',
    subtitle: 'Lana Del Rey',
    year: 2019,
    genres: ['alt-pop'],
    artColor: '#3A2A2A',
    artist: 'Lana Del Rey',
    album: 'Norman Fucking Rockwell!',
    musicKind: 'song',
  },
  {
    id: 'music-radiohead',
    type: 'music',
    title: 'Radiohead',
    subtitle: 'Artist',
    year: 1985,
    genres: ['alt-rock', 'experimental'],
    artColor: '#1A1A1A',
    artist: 'Radiohead',
    musicKind: 'artist',
  },
  {
    id: 'music-ok-computer',
    type: 'music',
    title: 'OK Computer',
    subtitle: 'Radiohead',
    year: 1997,
    genres: ['alt-rock'],
    artColor: '#1A2A1A',
    artist: 'Radiohead',
    album: 'OK Computer',
    musicKind: 'album',
  },
  {
    id: 'music-karma',
    type: 'music',
    title: 'Karma Police',
    subtitle: 'Radiohead',
    year: 1997,
    genres: ['alt-rock'],
    artColor: '#1A2A1A',
    artist: 'Radiohead',
    album: 'OK Computer',
    musicKind: 'song',
  },
  {
    id: 'music-renaissance',
    type: 'music',
    title: 'Renaissance',
    subtitle: 'Beyoncé',
    year: 2022,
    genres: ['dance', 'house', 'pop'],
    artColor: '#2A2A1A',
    artist: 'Beyoncé',
    album: 'Renaissance',
    musicKind: 'album',
  },
];

export function getCatalogById(id: string): MediaItem | undefined {
  return mockCatalog.find((m) => m.id === id);
}

export function getCatalogByType(type: MediaItem['type']): MediaItem[] {
  return mockCatalog.filter((m) => m.type === type);
}

export function searchCatalog(query: string, type?: MediaItem['type']): MediaItem[] {
  const q = query.trim().toLowerCase();
  let items = type ? getCatalogByType(type) : mockCatalog;
  if (!q) return items;
  return items.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.subtitle?.toLowerCase().includes(q) ||
      m.artist?.toLowerCase().includes(q) ||
      m.genres.some((g) => g.includes(q)),
  );
}

export const allGenres = Array.from(
  new Set(mockCatalog.flatMap((m) => m.genres)),
).sort();
