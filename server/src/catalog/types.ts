export type MediaType = 'movie' | 'show' | 'book' | 'music';
export type MusicKind = 'song' | 'album' | 'artist';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  subtitle?: string;
  year?: number;
  genres: string[];
  artColor: string;
  imageUrl?: string;
  seasons?: number;
  episodesPerSeason?: number;
  artist?: string;
  album?: string;
  musicKind?: MusicKind;
}
