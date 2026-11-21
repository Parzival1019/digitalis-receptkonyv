import { openDatabase, type DB } from '../server/src/db/connection';
import { createApp } from '../server/src/app';
import type { RecipeInput } from '../shared/schemas';

/** Új, memóriában futó, seedelt adatbázis és Express app minden teszthez. */
export function setup(options: { seed?: boolean } = {}) {
  const db: DB = openDatabase(':memory:', options);
  const app = createApp(db);
  return { db, app };
}

export function categoryId(db: DB, slug = 'foetelek'): number {
  return (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number }).id;
}

export function sampleRecipe(db: DB, overrides: Partial<RecipeInput> = {}): RecipeInput {
  return {
    title: 'Teszt rakott tészta',
    description: 'Egyszerű tesztrecept.',
    categoryId: categoryId(db, 'tesztak'),
    prepTimeMinutes: 35,
    servings: 2,
    difficulty: 'konnyu',
    imageUrl: null,
    isFeatured: false,
    ingredients: [
      { name: 'Penne', quantity: 250, unit: 'g' },
      { name: 'Tojás', quantity: 2, unit: 'db' },
      { name: 'Só', quantity: null, unit: '' },
    ],
    steps: ['Kifőzzük a tésztát.', 'Összekeverjük a tojással.', 'Megsütjük.'],
    ...overrides,
  };
}
