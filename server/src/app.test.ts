import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'betterboxd-test-'));
process.env.BETTERBOXD_DB_PATH = join(dbDir, 'test.sqlite');

const { app } = await import('./app.js');
const { seed } = await import('./seed.js');
const { db } = await import('./db.js');

type Json = Record<string, unknown>;

async function json(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: Json }> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await app.request(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: Json = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Json;
    } catch {
      parsed = { raw: text };
    }
  }
  return { status: res.status, body: parsed };
}

before(async () => {
  await seed();
});

after(() => {
  db.close();
});

describe('auth', () => {
  test('register and login', async () => {
    const email = `alex-${Date.now()}@test.local`;
    const username = `alex_${Date.now().toString(36).slice(-6)}`;
    const registered = await json('POST', '/auth/register', {
      email,
      username,
      password: 'password1',
      displayName: 'Alex Test',
    });
    assert.equal(registered.status, 201);
    assert.ok(typeof registered.body.token === 'string');

    const login = await json('POST', '/auth/login', { email, password: 'password1' });
    assert.equal(login.status, 200);
    assert.ok(typeof login.body.token === 'string');

    const me = await json('GET', '/auth/me', undefined, login.body.token as string);
    assert.equal(me.status, 200);
    assert.equal((me.body.user as Json).username, username);
  });
});

describe('friends privacy and feed', () => {
  let mayaToken = '';
  let jordanToken = '';
  let samToken = '';
  let strangerToken = '';

  before(async () => {
    mayaToken = (
      await json('POST', '/auth/login', {
        email: 'maya@betterboxd.local',
        password: 'password',
      })
    ).body.token as string;
    jordanToken = (
      await json('POST', '/auth/login', {
        email: 'jordan@betterboxd.local',
        password: 'password',
      })
    ).body.token as string;
    samToken = (
      await json('POST', '/auth/login', {
        email: 'sam@betterboxd.local',
        password: 'password',
      })
    ).body.token as string;

    const stranger = await json('POST', '/auth/register', {
      email: `stranger-${Date.now()}@test.local`,
      username: `str_${Date.now().toString(36).slice(-6)}`,
      password: 'password1',
      displayName: 'Stranger',
    });
    strangerToken = stranger.body.token as string;
  });

  test('seed friendships exist', async () => {
    const mayaFriends = await json('GET', '/friends', undefined, mayaToken);
    assert.equal(mayaFriends.status, 200);
    const names = ((mayaFriends.body.friends as Json[]) ?? []).map((f) => f.username);
    assert.ok(names.includes('j.watches'));
  });

  test('private profile blocks strangers but allows friends', async () => {
    const blocked = await json('GET', '/users/j.watches/diary', undefined, strangerToken);
    assert.equal(blocked.status, 403);

    const allowed = await json('GET', '/users/j.watches/diary', undefined, mayaToken);
    assert.equal(allowed.status, 200);
    assert.ok(Array.isArray(allowed.body.entries));
    assert.ok((allowed.body.entries as unknown[]).length > 0);
  });

  test('friend feed includes friend reviews', async () => {
    const feed = await json('GET', '/feed', undefined, mayaToken);
    assert.equal(feed.status, 200);
    const activities = feed.body.activities as Json[];
    assert.ok(activities.length > 0);
    const reviews = feed.body.reviews as Json[];
    assert.ok(reviews.some((r) => (r.media as Json)?.title === 'Severance'));
  });

  test('accept friend request unlocks feed visibility', async () => {
    const request = await json(
      'POST',
      '/friends/requests',
      { username: 'maya_reels' },
      strangerToken,
    );
    assert.equal(request.status, 201);
    const requestId = (request.body.request as Json).id as string;

    const accept = await json('POST', `/friends/requests/${requestId}/accept`, {}, mayaToken);
    assert.equal(accept.status, 200);

    const feed = await json('GET', '/feed', undefined, strangerToken);
    assert.equal(feed.status, 200);
    assert.ok(((feed.body.activities as Json[]) ?? []).length > 0);
  });

  test('diary delete is owner-scoped', async () => {
    const created = await json(
      'POST',
      '/diary',
      {
        media: {
          id: 'movie-aftersun',
          type: 'movie',
          title: 'Aftersun',
          subtitle: 'Charlotte Wells',
          year: 2022,
          genres: ['drama'],
          artColor: '#1A3A3A',
          imageUrl: null,
          artist: null,
          album: null,
          musicKind: null,
        },
        loggedOn: '2024-11-12',
        rating: 4,
      },
      samToken,
    );
    assert.equal(created.status, 201);
    const entryId = (created.body.entry as Json).id as string;

    const forbidden = await json('DELETE', `/diary/${entryId}`, undefined, mayaToken);
    assert.equal(forbidden.status, 404);

    const ok = await json('DELETE', `/diary/${entryId}`, undefined, samToken);
    assert.equal(ok.status, 204);
  });
});
