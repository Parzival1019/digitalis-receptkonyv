/**
 * Adatbázis visszaállítása a kezdőállapotra: `npm run db:reset`.
 * Törli az adatbázisfájlt, majd újra létrehozza és feltölti a mintaadatokkal.
 */
import fs from 'node:fs';
import { DB_FILE } from '../config';
import { openDatabase } from './connection';

for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(DB_FILE + suffix, { force: true });
}
const db = openDatabase(DB_FILE);
const { count } = db.prepare('SELECT COUNT(*) AS count FROM recipes').get() as { count: number };
db.close();
console.log(`Adatbázis visszaállítva: ${DB_FILE} (${count} recept)`);
