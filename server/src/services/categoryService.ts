import { toSearchText } from '../../../shared/text';
import type { Category } from '../../../shared/types';
import type { DB } from '../db/tx';
import { conflict, notFound } from '../lib/errors';

export function listCategories(db: DB): Category[] {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.icon, COUNT(r.id) AS recipe_count
       FROM categories c
       LEFT JOIN recipes r ON r.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`,
    )
    .all() as { id: number; name: string; slug: string; icon: string; recipe_count: number }[];
  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, icon: r.icon, recipeCount: r.recipe_count }));
}

/** URL-barát azonosító képzése: „Főételek” → „foetelek”. */
export function slugify(name: string): string {
  return toSearchText(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createCategory(db: DB, data: { name: string; icon: string }): Category {
  const slug = slugify(data.name);
  const existing = db.prepare('SELECT 1 FROM categories WHERE slug = ? OR name = ?').get(slug, data.name);
  if (existing || !slug) throw conflict('Már létezik ilyen nevű kategória.');
  const { max } = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max FROM categories').get() as { max: number };
  const result = db
    .prepare('INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)')
    .run(data.name, slug, data.icon, max + 1);
  return { id: Number(result.lastInsertRowid), name: data.name, slug, icon: data.icon, recipeCount: 0 };
}

export function deleteCategory(db: DB, id: number): void {
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(id)) {
    throw notFound(`Nem található kategória ezzel az azonosítóval: ${id}`);
  }
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM recipes WHERE category_id = ?').get(id) as {
    count: number;
  };
  if (count > 0) throw conflict(`A kategória nem törölhető, mert ${count} recept tartozik hozzá.`);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}
