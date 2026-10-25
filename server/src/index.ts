import { serve } from '@hono/node-server';

import { app } from './app.js';
import { seed } from './seed.js';

const port = Number(process.env.PORT ?? 8787);

await seed();

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
