import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { HttpError, nowPlusDays } from './http.js';
import { hashPassword, newSessionToken, verifyPassword } from './passwords.js';
import * as repo from './repos.js';
import {
  colorFor,
  initialsFor,
  parseBio,
  parseBoolean,
  parseDisplayName,
  parseEmail,
  parseLoggedOn,
  parseMedia,
  parseMediaType,
  parseMusicKind,
  parseOptionalInt,
  parsePassword,
  parseRating,
  parseReviewDraft,
  parseSlots,
  parseTags,
  parseTopMode,
  parseUsername,
  readJson,
  requiredText,
} from './validate.js';

type Env = { Variables: { userId: string; token: string } };

export const app = new Hono<Env>();

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  }),
);

app.use('*', async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    const userId = token ? repo.userIdForToken(token) : undefined;
    if (token && userId) {
      c.set('userId', userId);
      c.set('token', token);
    }
  }
  await next();
});

function requireUser(c: { get: (key: 'userId') => string | undefined }): string {
  const userId = c.get('userId');
  if (!userId) throw new HttpError(401, 'Unauthorized');
  return userId;
}

function requireToken(c: { get: (key: 'token') => string | undefined }): string {
  const token = c.get('token');
  if (!token) throw new HttpError(401, 'Unauthorized');
  return token;
}

app.get('/health', (c) => c.json({ ok: true }));

app.post('/auth/register', async (c) => {
  const body = await readJson(c.req.raw);
  const email = parseEmail(body.email);
  const username = parseUsername(body.username);
  const password = parsePassword(body.password);
  const displayName = parseDisplayName(body.displayName);
  if (repo.findUserByEmail(email)) throw new HttpError(409, 'An account with that email already exists');
  if (repo.findUserByUsername(username)) throw new HttpError(409, 'That username is taken');
  const user = repo.insertUser({
    email,
    username,
    passwordHash: await hashPassword(password),
    displayName,
    avatarColor: colorFor(username),
    avatarInitials: initialsFor(displayName),
  });
  const token = newSessionToken();
  repo.createSession(user.id, token, nowPlusDays(30));
  return c.json({ token, user: repo.accountPayload(user.id).user }, 201);
});

app.post('/auth/login', async (c) => {
  const body = await readJson(c.req.raw);
  const email = parseEmail(body.email);
  const password = parsePassword(body.password);
  const user = repo.findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, 'Email or password is incorrect');
  }
  const token = newSessionToken();
  repo.createSession(user.id, token, nowPlusDays(30));
  return c.json({ token, user: repo.accountPayload(user.id).user });
});

app.post('/auth/logout', (c) => {
  const token = requireToken(c);
  repo.deleteSession(token);
  return c.body(null, 204);
});

app.get('/auth/me', (c) => c.json(repo.accountPayload(requireUser(c))));

app.patch('/users/me', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  const patch: { displayName?: string; bio?: string | null; isPublic?: boolean; initials?: string } = {};
  if ('displayName' in body) {
    patch.displayName = parseDisplayName(body.displayName);
    patch.initials = initialsFor(patch.displayName);
  }
  if ('bio' in body) patch.bio = parseBio(body.bio);
  if ('isPublic' in body) patch.isPublic = parseBoolean(body.isPublic, 'isPublic');
  if (Object.keys(patch).length === 0) throw new HttpError(400, 'Nothing to update');
  repo.updateUser(userId, patch);
  return c.json(repo.accountPayload(userId));
});

app.get('/users/search', (c) => {
  const userId = requireUser(c);
  const q = c.req.query('q') ?? '';
  return c.json({ results: repo.searchUsers(userId, q) });
});

app.get('/users/:username/diary', (c) => {
  const viewerId = requireUser(c);
  const user = repo.assertCanViewUser(viewerId, c.req.param('username'));
  return c.json(repo.listDiary(user.id));
});

app.get('/users/:username', (c) => {
  const viewerId = requireUser(c);
  const user = repo.findUserByUsername(c.req.param('username'));
  if (!user) throw new HttpError(404, 'User not found');
  return c.json(repo.userForViewer(user, viewerId));
});

app.get('/friends', (c) => c.json({ friends: repo.listFriends(requireUser(c)) }));

app.get('/friends/requests', (c) => c.json(repo.listRequests(requireUser(c))));

app.post('/friends/requests', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  const request = repo.requestFriend(userId, parseUsername(body.username));
  return c.json({ request }, 201);
});

app.post('/friends/requests/:id/accept', (c) => {
  const friend = repo.acceptRequest(requireUser(c), c.req.param('id'));
  return c.json({ friend });
});

app.post('/friends/requests/:id/decline', (c) => {
  repo.declineRequest(requireUser(c), c.req.param('id'));
  return c.json({ ok: true });
});

app.delete('/friends/:userId', (c) => {
  repo.unfriend(requireUser(c), c.req.param('userId'));
  return c.json({ ok: true });
});

app.get('/diary', (c) => c.json(repo.listDiary(requireUser(c))));

app.post('/diary', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  const review = parseReviewDraft(body.review);
  const result = repo.createDiary(userId, {
    media: parseMedia(body.media),
    loggedOn: parseLoggedOn(body.loggedOn),
    season: parseOptionalInt(body.season, 'season'),
    episode: parseOptionalInt(body.episode, 'episode'),
    musicKind: parseMusicKind(body.musicKind),
    rating: parseRating(body.rating, false),
    review,
  });
  return c.json(result, 201);
});

app.delete('/diary/:id', (c) => {
  repo.deleteDiary(requireUser(c), c.req.param('id'));
  return c.body(null, 204);
});

app.post('/reviews', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  const rating = parseRating(body.rating, true);
  const review = repo.addReview(userId, {
    diaryEntryId: requiredText(body.diaryEntryId, 'diaryEntryId', 80),
    rating: rating as number,
    body: requiredText(body.body, 'body', 5000),
    tags: parseTags(body.tags),
  });
  return c.json({ review }, 201);
});

app.get('/reviews/:id/comments', (c) => {
  const userId = requireUser(c);
  repo.getVisibleReview(userId, c.req.param('id'));
  return c.json({ comments: repo.listComments(c.req.param('id')) });
});

app.post('/reviews/:id/comments', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  const comment = repo.addComment(userId, c.req.param('id'), requiredText(body.body, 'body', 2000));
  return c.json({ comment }, 201);
});

app.get('/reviews/:id', (c) => {
  const userId = requireUser(c);
  const review = repo.getVisibleReview(userId, c.req.param('id'));
  return c.json({ review, comments: repo.listComments(review.id) });
});

app.get('/media/:type/:id/reviews', (c) => {
  const userId = requireUser(c);
  parseMediaType(c.req.param('type'));
  return c.json({ reviews: repo.listVisibleMediaReviews(userId, c.req.param('id')) });
});

app.get('/me/comments', (c) => c.json({ comments: repo.listOwnComments(requireUser(c)) }));

app.get('/feed', (c) => {
  const userId = requireUser(c);
  const type = c.req.query('type');
  const mediaType = type && type !== 'all' ? parseMediaType(type) : undefined;
  return c.json(repo.feed(userId, mediaType));
});

app.get('/lists', (c) => c.json({ lists: repo.listsFor(requireUser(c)) }));

app.post('/lists/items', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  return c.json(repo.addToList(userId, parseMedia(body.media)));
});

app.delete('/lists/items/:mediaId', (c) => {
  repo.removeFromList(requireUser(c), c.req.param('mediaId'));
  return c.json({ lists: repo.listsFor(requireUser(c)) });
});

app.get('/top-five', (c) => c.json({ topFive: repo.topFiveFor(requireUser(c)) }));

app.patch('/top-five', async (c) => {
  const userId = requireUser(c);
  const body = await readJson(c.req.raw);
  const mode = parseTopMode(body.mode);
  const slots = 'slots' in body ? parseSlots(body.slots) : undefined;
  return c.json({ topFive: repo.updateTopFive(userId, mode, slots) });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: 'Something went wrong' }, 500);
});
