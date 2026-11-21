import type { DatabaseSync } from 'node:sqlite';

export type DB = DatabaseSync;

/** Tranzakcióban futtat egy függvényt: hiba esetén minden változást visszavon. */
export function transaction<T>(db: DB, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
