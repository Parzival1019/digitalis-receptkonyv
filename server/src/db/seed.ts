import { createRecipe } from '../services/recipeService';
import { SEED_CATEGORIES, SEED_RECIPES } from './seedData';
import { transaction, type DB } from './tx';

/** A seed verziója – ha később új kezdőadat-csomag készül, ezt kell növelni. */
export const SEED_VERSION = '1';

/**
 * Idempotens seedelés:
 * - a kategóriák `INSERT OR IGNORE`-ral kerülnek be (egyedi név/slug alapján),
 * - a receptek csak egyszer, az első induláskor töltődnek be; ezt az `app_meta`
 *   tábla `seed_version` kulcsa jelzi. Így újraindításkor nem duplikálódnak,
 *   és a felhasználó által törölt mintareceptek sem „támadnak fel”.
 */
export function seedDatabase(db: DB): { seeded: boolean } {
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)',
  );
  SEED_CATEGORIES.forEach((c, index) => insertCategory.run(c.name, c.slug, c.icon, index));

  const meta = db.prepare("SELECT value FROM app_meta WHERE key = 'seed_version'").get() as
    | { value: string }
    | undefined;
  if (meta) return { seeded: false };

  transaction(db, () => {
    const categoryIdBySlug = new Map(
      (db.prepare('SELECT id, slug FROM categories').all() as { id: number; slug: string }[]).map((c) => [
        c.slug,
        c.id,
      ]),
    );

    // A mintareceptek létrehozási idejét percenként eltoljuk, hogy a
    // „legújabb” szerinti rendezés is értelmes eredményt adjon.
    const base = Date.now() - SEED_RECIPES.length * 60_000;
    SEED_RECIPES.forEach((r, index) => {
      const categoryId = categoryIdBySlug.get(r.category);
      if (!categoryId) throw new Error(`Ismeretlen kategória a seedben: ${r.category}`);
      createRecipe(
        db,
        {
          title: r.title,
          description: r.description,
          categoryId,
          prepTimeMinutes: r.prepTimeMinutes,
          servings: r.servings,
          difficulty: r.difficulty,
          imageUrl: null,
          isFeatured: r.isFeatured ?? false,
          ingredients: r.ingredients.map(([name, quantity, unit]) => ({ name, quantity, unit })),
          steps: r.steps,
        },
        { timestamp: new Date(base + index * 60_000).toISOString(), useTransaction: false },
      );
    });

    db.prepare("INSERT INTO app_meta (key, value) VALUES ('seed_version', ?)").run(SEED_VERSION);
  });

  return { seeded: true };
}
