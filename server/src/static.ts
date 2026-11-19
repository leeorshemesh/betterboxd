import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { serveStatic } from '@hono/node-server/serve-static';
import type { Env, Hono } from 'hono';

function isApiPath(path: string): boolean {
  return (
    path.startsWith('/auth') ||
    path.startsWith('/catalog') ||
    path.startsWith('/health') ||
    path.startsWith('/diary') ||
    path.startsWith('/feed') ||
    path.startsWith('/friends') ||
    path.startsWith('/lists') ||
    path.startsWith('/top-five') ||
    path.startsWith('/users') ||
    path.startsWith('/reviews') ||
    path.startsWith('/media') ||
    path.startsWith('/me') ||
    path.startsWith('/uploads')
  );
}

/** Serve Expo web export from server/public when present (one-host showcase deploy). */
export function mountWebExport<E extends Env>(app: Hono<E>): void {
  const root = 'public';
  if (!existsSync(join(process.cwd(), root, 'index.html'))) return;

  app.use('/*', async (c, next) => {
    if (isApiPath(c.req.path)) return next();
    return serveStatic({ root })(c, next);
  });

  app.get('*', async (c, next) => {
    if (isApiPath(c.req.path)) return next();
    return serveStatic({ root, path: 'index.html' })(c, next);
  });
}
