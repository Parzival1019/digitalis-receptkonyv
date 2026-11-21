import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema';
import { seedDatabase } from './seed';
import type { DB } from './tx';

export type { DB } from './tx';

/**
 * Megnyitja (szükség esetén létrehozza) az adatbázist, lefuttatja a sémát
 * és – ha még nem történt meg – betölti a kezdőadatokat.
 * A Node.js beépített `node:sqlite` modulját használjuk, így nincs szükség
 * natív (C++) fordításra a telepítéskor sem macOS-en, sem Windowson.
 */
export function openDatabase(file: string, options: { seed?: boolean } = {}): DB {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL);
  if (options.seed !== false) seedDatabase(db);
  return db;
}
