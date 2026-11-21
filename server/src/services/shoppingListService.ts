/**
 * Bevásárlólista üzleti logikája.
 *
 * Összevonási szabály: egy új tétel akkor kerül összevonásra egy meglévővel, ha
 *  1. a nevük normalizálva megegyezik (kis-/nagybetű és szóközök nem számítanak),
 *  2. a mértékegységük (egységesítés után) azonos,
 *  3. a meglévő tétel még nincs kipipálva (a már megvett tételhez nem adunk hozzá),
 *  4. mindkettőnek van mennyisége, vagy egyiknek sincs („ízlés szerint”).
 * Különböző mértékegységű tételek (pl. 200 g és 2 ek) külön sorban maradnak.
 */
import { normalizeKey, normalizeUnit, roundQuantity, scaleQuantity } from '../../../shared/text';
import type { AddFromRecipeResult, ShoppingListItem } from '../../../shared/types';
import { nowIso, transaction, type DB } from '../db/tx';
import { notFound } from '../lib/errors';
import { getRecipe, getOrCreateIngredient } from './recipeService';

interface ItemRow {
  id: number;
  name: string;
  quantity: number | null;
  unit: string;
  is_checked: number;
  created_at: string;
  updated_at: string;
}

function mapItem(row: ItemRow): ShoppingListItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    isChecked: row.is_checked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ITEM_COLUMNS = 'id, name, quantity, unit, is_checked, created_at, updated_at';

export function listItems(db: DB): ShoppingListItem[] {
  const rows = db
    .prepare(`SELECT ${ITEM_COLUMNS} FROM shopping_list_items ORDER BY is_checked ASC, normalized_name ASC, id ASC`)
    .all() as unknown as ItemRow[];
  return rows.map(mapItem);
}

export function getItem(db: DB, id: number): ShoppingListItem {
  const row = db.prepare(`SELECT ${ITEM_COLUMNS} FROM shopping_list_items WHERE id = ?`).get(id) as
    | ItemRow
    | undefined;
  if (!row) throw notFound(`Nem található bevásárlólista-tétel ezzel az azonosítóval: ${id}`);
  return mapItem(row);
}

export interface NewItem {
  name: string;
  quantity: number | null;
  unit: string;
}

/**
 * Tétel hozzáadása összevonással. Visszaadja az érintett tételt és azt,
 * hogy összevonás történt-e.
 */
export function addOrMergeItem(db: DB, item: NewItem): { item: ShoppingListItem; merged: boolean } {
  const name = item.name.trim().replace(/\s+/g, ' ');
  const key = normalizeKey(name);
  const unit = normalizeUnit(item.unit);
  const timestamp = nowIso();

  const existing = db
    .prepare(
      `SELECT id, quantity FROM shopping_list_items
       WHERE normalized_name = ? AND unit = ? AND is_checked = 0
         AND ((quantity IS NULL) = (? IS NULL))
       ORDER BY id LIMIT 1`,
    )
    .get(key, unit, item.quantity) as { id: number; quantity: number | null } | undefined;

  if (existing) {
    const newQuantity =
      existing.quantity !== null && item.quantity !== null ? roundQuantity(existing.quantity + item.quantity) : null;
    db.prepare('UPDATE shopping_list_items SET quantity = ?, updated_at = ? WHERE id = ?').run(
      newQuantity,
      timestamp,
      existing.id,
    );
    return { item: getItem(db, existing.id), merged: true };
  }

  const ingredientId = getOrCreateIngredient(db, name);
  const result = db
    .prepare(
      `INSERT INTO shopping_list_items (ingredient_id, name, normalized_name, quantity, unit, is_checked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .run(ingredientId, name, key, item.quantity, unit, timestamp, timestamp);
  return { item: getItem(db, Number(result.lastInsertRowid)), merged: false };
}

/**
 * Egy recept összes hozzávalójának hozzáadása a listához.
 * Ha `servings` meg van adva, a mennyiségeket arányosan átszámítjuk.
 */
export function addFromRecipe(db: DB, recipeId: number, servings?: number): AddFromRecipeResult {
  const recipe = getRecipe(db, recipeId);
  const targetServings = servings ?? recipe.servings;

  return transaction(db, () => {
    let added = 0;
    let merged = 0;
    for (const ing of recipe.ingredients) {
      const result = addOrMergeItem(db, {
        name: ing.name,
        quantity: scaleQuantity(ing.quantity, recipe.servings, targetServings),
        unit: ing.unit,
      });
      if (result.merged) merged += 1;
      else added += 1;
    }
    return { recipeId, added, merged, items: listItems(db) };
  });
}

export function updateItem(
  db: DB,
  id: number,
  changes: { name?: string; quantity?: number | null; unit?: string; isChecked?: boolean },
): ShoppingListItem {
  const current = getItem(db, id);
  const name = changes.name !== undefined ? changes.name.trim().replace(/\s+/g, ' ') : current.name;
  const quantity = changes.quantity !== undefined ? changes.quantity : current.quantity;
  const unit = changes.unit !== undefined ? normalizeUnit(changes.unit) : current.unit;
  const isChecked = changes.isChecked !== undefined ? changes.isChecked : current.isChecked;

  db.prepare(
    `UPDATE shopping_list_items
     SET name = ?, normalized_name = ?, quantity = ?, unit = ?, is_checked = ?, updated_at = ?
     WHERE id = ?`,
  ).run(name, normalizeKey(name), quantity, unit, isChecked ? 1 : 0, nowIso(), id);
  return getItem(db, id);
}

export function deleteItem(db: DB, id: number): void {
  const result = db.prepare('DELETE FROM shopping_list_items WHERE id = ?').run(id);
  if (result.changes === 0) throw notFound(`Nem található bevásárlólista-tétel ezzel az azonosítóval: ${id}`);
}

export function deleteCheckedItems(db: DB): number {
  return Number(db.prepare('DELETE FROM shopping_list_items WHERE is_checked = 1').run().changes);
}

export function clearList(db: DB): number {
  return Number(db.prepare('DELETE FROM shopping_list_items').run().changes);
}
