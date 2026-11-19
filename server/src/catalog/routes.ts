import { Hono } from 'hono';

import { HttpError } from '../http.js';
import { rateLimit } from '../rateLimit.js';
import { parseMediaType } from '../validate.js';
import {
  catalogGetById,
  catalogListGenres,
  catalogProviderStatus,
  catalogSearch,
  catalogSeasonEpisodes,
  catalogSimilar,
} from './service.js';

type Env = { Variables: { userId: string; token: string } };

function requireUser(c: { get: (key: 'userId') => string | undefined }): string {
  const userId = c.get('userId');
  if (!userId) throw new HttpError(401, 'Unauthorized');
  return userId;
}

export const catalogRoutes = new Hono<Env>();

catalogRoutes.use(
  '*',
  rateLimit({ limit: 30, windowMs: 60_000, keySuffix: 'catalog' }),
);

catalogRoutes.get('/search', async (c) => {
  requireUser(c);
  const q = c.req.query('q') ?? '';
  const typeRaw = c.req.query('type');
  const genre = c.req.query('genre') || undefined;
  const type = typeRaw && typeRaw !== 'all' ? parseMediaType(typeRaw) : undefined;
  const results = await catalogSearch({ query: q, type, genre });
  return c.json({ results, providers: catalogProviderStatus() });
});

catalogRoutes.get('/genres', async (c) => {
  requireUser(c);
  return c.json({ genres: await catalogListGenres() });
});

catalogRoutes.get('/status', (c) => {
  requireUser(c);
  return c.json({ providers: catalogProviderStatus() });
});

catalogRoutes.get('/:type/:id/similar', async (c) => {
  requireUser(c);
  parseMediaType(c.req.param('type'));
  const id = decodeURIComponent(c.req.param('id'));
  return c.json({ results: await catalogSimilar(id) });
});

catalogRoutes.get('/:type/:id/seasons/:season', async (c) => {
  requireUser(c);
  parseMediaType(c.req.param('type'));
  const id = decodeURIComponent(c.req.param('id'));
  const season = Number(c.req.param('season'));
  if (!Number.isFinite(season) || season < 1) throw new HttpError(400, 'Invalid season');
  const result = await catalogSeasonEpisodes(id, season);
  if (!result) throw new HttpError(404, 'Season not found');
  return c.json(result);
});

catalogRoutes.get('/:type/:id', async (c) => {
  requireUser(c);
  parseMediaType(c.req.param('type'));
  const id = decodeURIComponent(c.req.param('id'));
  const item = await catalogGetById(id);
  if (!item) throw new HttpError(404, 'Media not found');
  return c.json({ item });
});
