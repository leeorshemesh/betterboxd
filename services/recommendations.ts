import { mediaService, rankAndDedupe } from '@/services/mediaService';
import type { DiaryEntry, MediaItem, Review } from '@/types';

const HIGH_RATING = 4;
const FRIEND_RATING = 4.5;
const LIMIT = 16;

export async function buildForYou(options: {
  diary: DiaryEntry[];
  friendReviews: Review[];
  listMediaIds: string[];
}): Promise<MediaItem[]> {
  const loggedIds = new Set(options.diary.map((entry) => entry.media.id));
  const excluded = new Set([...loggedIds, ...options.listMediaIds]);

  const seeds = options.diary
    .filter((entry) => (entry.rating ?? 0) >= HIGH_RATING)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const similarBatches = await Promise.all(
    seeds.map(async (entry) => {
      try {
        return await mediaService.similar(entry.media.id);
      } catch {
        return [] as MediaItem[];
      }
    }),
  );

  const fromTaste = similarBatches.flat().filter((item) => !excluded.has(item.id));

  const fromFriends: MediaItem[] = [];
  for (const review of options.friendReviews) {
    if (review.rating < FRIEND_RATING) continue;
    const media = review.media;
    if (!media || excluded.has(media.id)) continue;
    fromFriends.push(media);
  }

  // Prefer friend picks first (social signal), then taste-based similar.
  return rankAndDedupe([...fromFriends, ...fromTaste]).slice(0, LIMIT);
}
