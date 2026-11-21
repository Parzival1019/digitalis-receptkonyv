import type { z } from 'zod';
import { badRequest } from './errors';

/** Zod-séma alapú validálás; hiba esetén 400-as, mezőnkénti üzeneteket tartalmazó hibát dob. */
export function validate<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest(
      'Érvénytelen adatok.',
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

/** URL-paraméterben kapott azonosító ellenőrzése. */
export function parseId(raw: string | undefined, label = 'azonosító'): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`Érvénytelen ${label}: ${raw}`);
  }
  return id;
}
