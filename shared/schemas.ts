/**
 * Zod validációs sémák. A backend ezekkel ellenőrzi a beérkező adatokat,
 * a frontend pedig ugyanezekkel validálja az űrlapokat beküldés előtt.
 */
import { z } from 'zod';

const difficultySchema = z.enum(['konnyu', 'kozepes', 'nehez'], {
  error: 'Válassz nehézségi szintet.',
});

export const ingredientInputSchema = z.object({
  name: z
    .string({ error: 'Add meg a hozzávaló nevét.' })
    .trim()
    .min(1, 'Add meg a hozzávaló nevét.')
    .max(100, 'A hozzávaló neve legfeljebb 100 karakter lehet.'),
  quantity: z
    .number({ error: 'A mennyiség csak szám lehet.' })
    .positive('A mennyiségnek nullánál nagyobbnak kell lennie.')
    .max(100000, 'A mennyiség túl nagy.')
    .nullable(),
  unit: z.string().trim().max(30, 'A mértékegység legfeljebb 30 karakter lehet.').default(''),
});

const imageUrlSchema = z
  .string()
  .trim()
  .max(4_000_000, 'A kép túl nagy.')
  .refine(
    (v) => v === '' || /^https?:\/\/\S+$/i.test(v) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v),
    'A kép URL-jének http(s):// kezdetűnek kell lennie.',
  )
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

export const recipeInputSchema = z.object({
  title: z
    .string({ error: 'Add meg a recept nevét.' })
    .trim()
    .min(2, 'A recept neve legalább 2 karakter legyen.')
    .max(120, 'A recept neve legfeljebb 120 karakter lehet.'),
  description: z.string().trim().max(500, 'A leírás legfeljebb 500 karakter lehet.').default(''),
  categoryId: z
    .number({ error: 'Válassz kategóriát.' })
    .int('Válassz kategóriát.')
    .positive('Válassz kategóriát.'),
  prepTimeMinutes: z
    .number({ error: 'Add meg az elkészítési időt.' })
    .int('Az elkészítési idő egész szám legyen.')
    .min(1, 'Az elkészítési idő legalább 1 perc.')
    .max(1440, 'Az elkészítési idő legfeljebb 1440 perc (24 óra).'),
  servings: z
    .number({ error: 'Add meg az adagok számát.' })
    .int('Az adagok száma egész szám legyen.')
    .min(1, 'Legalább 1 adag szükséges.')
    .max(100, 'Legfeljebb 100 adag adható meg.'),
  difficulty: difficultySchema,
  imageUrl: imageUrlSchema,
  isFeatured: z.boolean().default(false),
  ingredients: z
    .array(ingredientInputSchema, { error: 'Add meg a hozzávalókat.' })
    .min(1, 'Legalább egy hozzávaló szükséges.')
    .max(100, 'Legfeljebb 100 hozzávaló adható meg.'),
  steps: z
    .array(
      z.string().trim().min(1, 'Az elkészítési lépés nem lehet üres.').max(2000, 'Egy lépés legfeljebb 2000 karakter.'),
      { error: 'Add meg az elkészítési lépéseket.' },
    )
    .min(1, 'Legalább egy elkészítési lépés szükséges.')
    .max(50, 'Legfeljebb 50 lépés adható meg.'),
});

export type RecipeInput = z.input<typeof recipeInputSchema>;
export type RecipeData = z.output<typeof recipeInputSchema>;

/** Üres query-paraméter ("") kezelése hiányzóként. */
const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

export const recipeQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  ingredient: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  category: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  maxTime: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: 'A maxTime szám legyen.' }).int().positive().max(1440).optional(),
  ),
  difficulty: z.preprocess(emptyToUndefined, difficultySchema.optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(['name', 'time', 'newest']).default('name')),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('asc')),
  favorites: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).optional()),
  featured: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).optional()),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).optional()),
});

export type RecipeQuery = z.output<typeof recipeQuerySchema>;

export const shoppingItemCreateSchema = z.object({
  name: z
    .string({ error: 'Add meg a tétel nevét.' })
    .trim()
    .min(1, 'Add meg a tétel nevét.')
    .max(100, 'A tétel neve legfeljebb 100 karakter lehet.'),
  quantity: z
    .number({ error: 'A mennyiség csak szám lehet.' })
    .positive('A mennyiségnek nullánál nagyobbnak kell lennie.')
    .max(100000, 'A mennyiség túl nagy.')
    .nullable()
    .default(null),
  unit: z.string().trim().max(30, 'A mértékegység legfeljebb 30 karakter lehet.').default(''),
});

export const shoppingItemUpdateSchema = z
  .object({
    name: shoppingItemCreateSchema.shape.name.optional(),
    quantity: z
      .number({ error: 'A mennyiség csak szám lehet.' })
      .positive('A mennyiségnek nullánál nagyobbnak kell lennie.')
      .max(100000, 'A mennyiség túl nagy.')
      .nullable()
      .optional(),
    unit: z.string().trim().max(30).optional(),
    isChecked: z.boolean({ error: 'Az isChecked mező logikai érték legyen.' }).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'Legalább egy módosítandó mezőt meg kell adni.',
  });

export const addFromRecipeSchema = z.object({
  servings: z
    .number({ error: 'Az adagszám szám legyen.' })
    .int()
    .min(1, 'Legalább 1 adag.')
    .max(100, 'Legfeljebb 100 adag.')
    .optional(),
});

export const categoryInputSchema = z.object({
  name: z
    .string({ error: 'Add meg a kategória nevét.' })
    .trim()
    .min(2, 'A kategória neve legalább 2 karakter legyen.')
    .max(40, 'A kategória neve legfeljebb 40 karakter lehet.'),
  icon: z.string().trim().max(40).default('utensils'),
});
