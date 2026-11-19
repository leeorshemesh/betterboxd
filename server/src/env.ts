import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Load server/.env into process.env without overriding existing vars. */
export function loadEnv(): void {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const path = join(root, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

export function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function corsOrigins(): string[] {
  const raw = env('CORS_ORIGIN') ?? 'http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Demo Maya/Jordan/Sam accounts. On in local/dev when unset; off when
 * NODE_ENV=production unless ENABLE_SEED is explicitly true.
 */
export function seedEnabled(): boolean {
  const raw = env('ENABLE_SEED');
  if (raw !== undefined) {
    return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
  }
  return process.env.NODE_ENV !== 'production';
}
