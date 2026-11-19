import './env.js';

import { serve } from '@hono/node-server';

import { app } from './app.js';
import { env, seedEnabled } from './env.js';
import { seed } from './seed.js';
import { mountWebExport } from './static.js';

mountWebExport(app);

const port = Number(env('PORT') ?? process.env.PORT ?? 8787);

if (seedEnabled()) {
  await seed();
  console.log('Demo seed accounts enabled (ENABLE_SEED)');
} else {
  console.log('Demo seed skipped (production / ENABLE_SEED=false)');
}

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
