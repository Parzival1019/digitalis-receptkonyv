import type { Stats } from '../../../shared/types';
import type { DB } from '../db/tx';

export function getStats(db: DB): Stats {
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    totalRecipes: count('SELECT COUNT(*) AS n FROM recipes'),
    favoriteCount: count('SELECT COUNT(*) AS n FROM favorites'),
    categoryCount: count('SELECT COUNT(*) AS n FROM categories'),
    shoppingListOpenCount: count('SELECT COUNT(*) AS n FROM shopping_list_items WHERE is_checked = 0'),
  };
}
