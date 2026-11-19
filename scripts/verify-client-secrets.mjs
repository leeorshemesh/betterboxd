/**
 * Fail if the web export under server/public looks like it embedded
 * TMDB/Spotify secrets or client-side provider URLs that belong on the API only.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const publicDir = join(root, 'server', 'public');

const forbidden = [
  { label: 'EXPO_PUBLIC_TMDB_API_KEY', re: /EXPO_PUBLIC_TMDB_API_KEY/ },
  { label: 'EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET', re: /EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET/ },
  { label: 'api.themoviedb.org', re: /api\.themoviedb\.org/ },
  { label: 'accounts.spotify.com/api/token', re: /accounts\.spotify\.com\/api\/token/ },
];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.(js|html|json|map)$/i.test(name)) out.push(path);
  }
  return out;
}

if (!existsSync(join(publicDir, 'index.html'))) {
  console.error('Missing server/public — run npm run build:showcase first.');
  process.exit(1);
}

const files = walk(publicDir);
let failed = false;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const { label, re } of forbidden) {
    if (re.test(text)) {
      console.error(`Found ${label} in ${file.replace(root, '')}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('Client bundle secret check failed.');
  process.exit(1);
}

console.log(`Client secret check passed (${files.length} files under server/public).`);
