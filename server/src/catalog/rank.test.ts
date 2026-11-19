import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rankAndDedupe } from './rank.js';
import type { MediaItem } from './types.js';

function item(partial: Partial<MediaItem> & Pick<MediaItem, 'id' | 'title'>): MediaItem {
  return {
    type: 'music',
    genres: [],
    artColor: '#111',
    ...partial,
  };
}

test('rankAndDedupe prefers exact artist title matches', () => {
  const ranked = rankAndDedupe(
    [
      item({ id: '1', title: 'Radiohead (Live)', musicKind: 'song', popularity: 90 }),
      item({ id: '2', title: 'Radiohead', musicKind: 'artist', artist: 'Radiohead', popularity: 80 }),
      item({ id: '3', title: 'Creep', musicKind: 'song', artist: 'Radiohead', popularity: 95 }),
    ],
    'Radiohead',
  );
  assert.equal(ranked[0]?.id, '2');
});

test('rankAndDedupe keeps provider order for empty queries when popularity ties', () => {
  const ranked = rankAndDedupe(
    [
      item({ id: 'a', title: 'Zebra', popularity: 10 }),
      item({ id: 'b', title: 'Apple', popularity: 10 }),
    ],
    '',
  );
  assert.deepEqual(
    ranked.map((row) => row.id),
    ['a', 'b'],
  );
});
