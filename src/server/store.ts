import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { defaultProfile, validateProfile } from '../shared/profile.ts';
import type { Profile } from '../shared/types.ts';
export class Store {
  readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
    if (!this.get('profile')) this.set('profile', defaultProfile);
  }
  get<T>(key: string): T | undefined {
    const row = this.db.prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) as T : undefined;
  }
  set(key: string, value: unknown) { this.db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, JSON.stringify(value)); }
  profile(): Profile { return validateProfile(this.get('profile')); }
  saveProfile(value: unknown): Profile { const p = validateProfile(value); this.set('profile', p); return p; }
  close() { this.db.close(); }
}
