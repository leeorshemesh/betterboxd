import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dataDir = join(root, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.BETTERBOXD_DB_PATH ?? join(dataDir, 'betterboxd.sqlite');
const dbParent = dirname(dbPath);
mkdirSync(dbParent, { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA busy_timeout = 5000');

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const migrationsDir = join(root, '..', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const id = file.replace(/\.sql$/, '');
    const applied = db.prepare('SELECT id FROM schema_migrations WHERE id = ?').get(id);
    if (applied) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
        id,
        new Date().toISOString(),
      );
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

migrate();

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function all<T>(sql: string, params: SQLInputValue[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, params: SQLInputValue[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: SQLInputValue[] = []): void {
  db.prepare(sql).run(...params);
}

export function nowIso(): string {
  return new Date().toISOString();
}
