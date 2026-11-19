import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const publicDir = join(root, 'server', 'public');

const env = {
  ...process.env,
  // Same-origin API when the Node server also serves the static site.
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
};

console.log('Exporting Expo web…');
const isWin = process.platform === 'win32';
const exportResult = spawnSync(
  isWin ? 'npx.cmd' : 'npx',
  ['expo', 'export', '-p', 'web'],
  // Windows needs shell so npx.cmd resolves; Unix keeps shell:false.
  { cwd: root, env, stdio: 'inherit', shell: isWin },
);
if (exportResult.status !== 0) {
  console.error('expo export failed', exportResult.error ?? `status ${exportResult.status}`);
  process.exit(exportResult.status ?? 1);
}

if (!existsSync(dist)) {
  console.error('Expected expo export output at dist/');
  process.exit(1);
}

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(dist, publicDir, { recursive: true });
console.log(`Copied web export → server/public`);
console.log('Start with: npm run server:prod');
