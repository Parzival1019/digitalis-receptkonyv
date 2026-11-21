/**
 * Relációs adatbázisséma. Minden tábla `IF NOT EXISTS` feltétellel jön létre,
 * így a migráció minden indításkor biztonságosan lefuttatható.
 */
export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  slug       TEXT    NOT NULL UNIQUE,
  icon       TEXT    NOT NULL DEFAULT 'utensils',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  title              TEXT    NOT NULL,
  search_title       TEXT    NOT NULL,
  description        TEXT    NOT NULL DEFAULT '',
  search_description TEXT    NOT NULL DEFAULT '',
  category_id        INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  prep_time_minutes  INTEGER NOT NULL CHECK (prep_time_minutes > 0),
  servings           INTEGER NOT NULL CHECK (servings > 0),
  difficulty         TEXT    NOT NULL CHECK (difficulty IN ('konnyu', 'kozepes', 'nehez')),
  image_url          TEXT,
  is_featured        INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  created_at         TEXT    NOT NULL,
  updated_at         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_search_title ON recipes(search_title);

-- Hozzávaló-törzs: minden hozzávaló egyszer szerepel (normalized_name egyedi).
CREATE TABLE IF NOT EXISTS ingredients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  search_name     TEXT NOT NULL
);

-- Kapcsolótábla: melyik recepthez melyik hozzávaló, mennyi és milyen egységben.
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id     INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  -- a receptben megjelenő név (a felhasználó által beírt írásmóddal)
  display_name  TEXT    NOT NULL,
  quantity      REAL CHECK (quantity IS NULL OR quantity > 0),
  unit          TEXT    NOT NULL DEFAULT '',
  position      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id   INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  instruction TEXT    NOT NULL,
  UNIQUE (recipe_id, step_number)
);

-- Egyfelhasználós alkalmazás: egy recept vagy kedvenc, vagy nem.
CREATE TABLE IF NOT EXISTS favorites (
  recipe_id  INTEGER PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id   INTEGER REFERENCES ingredients(id) ON DELETE SET NULL,
  name            TEXT    NOT NULL,
  normalized_name TEXT    NOT NULL,
  quantity        REAL CHECK (quantity IS NULL OR quantity > 0),
  unit            TEXT    NOT NULL DEFAULT '',
  is_checked      INTEGER NOT NULL DEFAULT 0 CHECK (is_checked IN (0, 1)),
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shopping_merge ON shopping_list_items(normalized_name, unit, is_checked);
`;
