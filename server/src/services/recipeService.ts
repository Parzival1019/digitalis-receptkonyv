/**
 * Receptekkel kapcsolatos üzleti logika és adatbázis-műveletek.
 */
import type { SQLInputValue } from 'node:sqlite';
import type { RecipeData, RecipeQuery } from '../../../shared/schemas';
import { normalizeKey, normalizeUnit, toSearchText } from '../../../shared/text';
import type { Recipe, RecipeIngredient, RecipeStep, RecipeSummary } from '../../../shared/types';
import { nowIso, transaction, type DB } from '../db/tx';
import { badRequest, notFound } from '../lib/errors';

interface RecipeRow {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_icon: string;
  prep_time_minutes: number;
  servings: number;
  difficulty: Recipe['difficulty'];
  image_url: string | null;
  is_featured: number;
  is_favorite: number;
  ingredient_count: number;
  created_at: string;
  updated_at: string;
}

const SUMMARY_SELECT = /* sql */ `
  SELECT r.id, r.title, r.description, r.category_id,
         c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
         r.prep_time_minutes, r.servings, r.difficulty, r.image_url, r.is_featured,
         r.created_at, r.updated_at,
         EXISTS (SELECT 1 FROM favorites f WHERE f.recipe_id = r.id) AS is_favorite,
         (SELECT COUNT(*) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredient_count
  FROM recipes r
  JOIN categories c ON c.id = r.category_id
`;

function mapSummary(row: RecipeRow): RecipeSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      icon: row.category_icon,
    },
    prepTimeMinutes: row.prep_time_minutes,
    servings: row.servings,
    difficulty: row.difficulty,
    imageUrl: row.image_url,
    isFeatured: row.is_featured === 1,
    isFavorite: row.is_favorite === 1,
    ingredientCount: row.ingredient_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A LIKE mintában különleges jelentésű karakterek (%, _) escape-elése. */
function likePattern(term: string): string {
  return `%${toSearchText(term).replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

/**
 * Receptek listázása keresési, szűrési és rendezési feltételekkel.
 * Minden feltétel együttesen (ÉS kapcsolattal) érvényesül.
 */
export function listRecipes(db: DB, query: RecipeQuery): RecipeSummary[] {
  const where: string[] = [];
  const params: Record<string, SQLInputValue> = {};

  if (query.q) {
    where.push(`(r.search_title LIKE :q ESCAPE '\\' OR r.search_description LIKE :q ESCAPE '\\')`);
    params.q = likePattern(query.q);
  }

  if (query.ingredient) {
    // Vesszővel elválasztott hozzávalók: a receptnek MINDEGYIKET tartalmaznia kell.
    const terms = query.ingredient
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
    terms.forEach((term, i) => {
      where.push(`EXISTS (
        SELECT 1 FROM recipe_ingredients ri
        JOIN ingredients i ON i.id = ri.ingredient_id
        WHERE ri.recipe_id = r.id AND i.search_name LIKE :ing${i} ESCAPE '\\'
      )`);
      params[`ing${i}`] = likePattern(term);
    });
  }

  if (query.category) {
    where.push('c.slug = :category');
    params.category = query.category;
  }
  if (query.maxTime !== undefined) {
    where.push('r.prep_time_minutes <= :maxTime');
    params.maxTime = query.maxTime;
  }
  if (query.difficulty) {
    where.push('r.difficulty = :difficulty');
    params.difficulty = query.difficulty;
  }
  if (query.favorites === 'true') {
    where.push('EXISTS (SELECT 1 FROM favorites f WHERE f.recipe_id = r.id)');
  }
  if (query.featured === 'true') {
    where.push('r.is_featured = 1');
  }

  const direction = query.order === 'desc' ? 'DESC' : 'ASC';
  const orderBy = {
    name: `r.search_title ${direction}`,
    time: `r.prep_time_minutes ${direction}, r.search_title ASC`,
    newest: `r.created_at ${query.order === 'asc' ? 'ASC' : 'DESC'}, r.id DESC`,
  }[query.sort];

  let sql = SUMMARY_SELECT;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` ORDER BY ${orderBy}`;
  if (query.limit) {
    sql += ' LIMIT :limit';
    params.limit = query.limit;
  }

  const rows = db.prepare(sql).all(params) as unknown as RecipeRow[];
  return rows.map(mapSummary);
}

export function getRecipe(db: DB, id: number): Recipe {
  const row = db.prepare(`${SUMMARY_SELECT} WHERE r.id = ?`).get(id) as RecipeRow | undefined;
  if (!row) throw notFound(`Nem található recept ezzel az azonosítóval: ${id}`);

  const ingredients = (
    db
      .prepare(
        `SELECT ri.id, ri.ingredient_id, ri.display_name AS name, ri.quantity, ri.unit
         FROM recipe_ingredients ri
         WHERE ri.recipe_id = ?
         ORDER BY ri.position`,
      )
      .all(id) as { id: number; ingredient_id: number; name: string; quantity: number | null; unit: string }[]
  ).map<RecipeIngredient>((r) => ({
    id: r.id,
    ingredientId: r.ingredient_id,
    name: r.name,
    quantity: r.quantity,
    unit: r.unit,
  }));

  const steps = (
    db
      .prepare('SELECT step_number, instruction FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number')
      .all(id) as { step_number: number; instruction: string }[]
  ).map<RecipeStep>((s) => ({ stepNumber: s.step_number, instruction: s.instruction }));

  return { ...mapSummary(row), ingredients, steps };
}

export function recipeExists(db: DB, id: number): boolean {
  return db.prepare('SELECT 1 FROM recipes WHERE id = ?').get(id) !== undefined;
}

function assertCategoryExists(db: DB, categoryId: number): void {
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId)) {
    throw badRequest('Érvénytelen adatok.', [{ path: 'categoryId', message: 'A kiválasztott kategória nem létezik.' }]);
  }
}

/**
 * Hozzávaló keresése a törzstáblában név alapján; ha nincs, létrehozza.
 * Így ugyanaz a hozzávaló (pl. „tojás”) minden receptben ugyanarra a rekordra mutat.
 */
export function getOrCreateIngredient(db: DB, name: string): number {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const key = normalizeKey(cleanName);
  db.prepare(
    'INSERT INTO ingredients (name, normalized_name, search_name) VALUES (?, ?, ?) ON CONFLICT(normalized_name) DO NOTHING',
  ).run(cleanName, key, toSearchText(cleanName));
  const row = db.prepare('SELECT id FROM ingredients WHERE normalized_name = ?').get(key) as { id: number };
  return row.id;
}

function writeIngredientsAndSteps(db: DB, recipeId: number, data: RecipeData): void {
  const insertIngredient = db.prepare(
    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, position) VALUES (?, ?, ?, ?, ?, ?)',
  );
  data.ingredients.forEach((ing, index) => {
    const ingredientId = getOrCreateIngredient(db, ing.name);
    insertIngredient.run(recipeId, ingredientId, ing.name.trim().replace(/\s+/g, ' '), ing.quantity, normalizeUnit(ing.unit), index);
  });

  const insertStep = db.prepare('INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)');
  data.steps.forEach((instruction, index) => insertStep.run(recipeId, index + 1, instruction));
}

export function createRecipe(
  db: DB,
  data: RecipeData,
  options: { timestamp?: string; useTransaction?: boolean } = {},
): Recipe {
  assertCategoryExists(db, data.categoryId);
  const timestamp = options.timestamp ?? nowIso();

  const run = () => {
    const result = db
      .prepare(
        `INSERT INTO recipes (title, search_title, description, search_description, category_id,
           prep_time_minutes, servings, difficulty, image_url, is_featured, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.title,
        toSearchText(data.title),
        data.description,
        toSearchText(data.description),
        data.categoryId,
        data.prepTimeMinutes,
        data.servings,
        data.difficulty,
        data.imageUrl,
        data.isFeatured ? 1 : 0,
        timestamp,
        timestamp,
      );
    const id = Number(result.lastInsertRowid);
    writeIngredientsAndSteps(db, id, data);
    return id;
  };

  const id = options.useTransaction === false ? run() : transaction(db, run);
  return getRecipe(db, id);
}

export function updateRecipe(db: DB, id: number, data: RecipeData): Recipe {
  if (!recipeExists(db, id)) throw notFound(`Nem található recept ezzel az azonosítóval: ${id}`);
  assertCategoryExists(db, data.categoryId);

  transaction(db, () => {
    db.prepare(
      `UPDATE recipes SET title = ?, search_title = ?, description = ?, search_description = ?,
         category_id = ?, prep_time_minutes = ?, servings = ?, difficulty = ?, image_url = ?,
         is_featured = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      data.title,
      toSearchText(data.title),
      data.description,
      toSearchText(data.description),
      data.categoryId,
      data.prepTimeMinutes,
      data.servings,
      data.difficulty,
      data.imageUrl,
      data.isFeatured ? 1 : 0,
      nowIso(),
      id,
    );
    // A hozzávalókat és lépéseket egyszerűen újraírjuk – így a sorrend is pontosan megmarad.
    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id);
    db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(id);
    writeIngredientsAndSteps(db, id, data);
  });

  return getRecipe(db, id);
}

export function deleteRecipe(db: DB, id: number): void {
  // A recipe_ingredients, recipe_steps és favorites sorok ON DELETE CASCADE miatt törlődnek.
  const result = db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
  if (result.changes === 0) throw notFound(`Nem található recept ezzel az azonosítóval: ${id}`);
}

/** Hozzávaló-javaslatok az űrlapok automatikus kiegészítéséhez. */
export function listIngredientNames(db: DB): string[] {
  return (db.prepare('SELECT name FROM ingredients ORDER BY search_name').all() as { name: string }[]).map(
    (r) => r.name,
  );
}
