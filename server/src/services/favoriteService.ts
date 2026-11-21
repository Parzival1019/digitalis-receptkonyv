import type { DB } from '../db/tx';
import { nowIso } from '../db/tx';
import { notFound } from '../lib/errors';
import { recipeExists } from './recipeService';

export function addFavorite(db: DB, recipeId: number): void {
  if (!recipeExists(db, recipeId)) throw notFound(`Nem található recept ezzel az azonosítóval: ${recipeId}`);
  // INSERT OR IGNORE: a művelet idempotens, többszöri hívás sem okoz hibát.
  db.prepare('INSERT OR IGNORE INTO favorites (recipe_id, created_at) VALUES (?, ?)').run(recipeId, nowIso());
}

export function removeFavorite(db: DB, recipeId: number): void {
  if (!recipeExists(db, recipeId)) throw notFound(`Nem található recept ezzel az azonosítóval: ${recipeId}`);
  db.prepare('DELETE FROM favorites WHERE recipe_id = ?').run(recipeId);
}
