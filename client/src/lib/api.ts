/**
 * Típusos API-kliens. Minden adatkezelési művelet a valódi REST API-n keresztül történik.
 */
import type { RecipeInput } from '../../../shared/schemas';
import type {
  AddFromRecipeResult,
  ApiErrorBody,
  ApiErrorDetail,
  Category,
  Recipe,
  RecipeSummary,
  ShoppingListItem,
  Stats,
} from '../../../shared/types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Nem sikerült kapcsolódni a szerverhez. Fut a backend?');
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const err = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? `Váratlan hiba (${response.status}).`,
      err?.details,
    );
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export interface RecipeFilters {
  q?: string;
  ingredient?: string;
  category?: string;
  maxTime?: number | string;
  difficulty?: string;
  sort?: 'name' | 'time' | 'newest';
  order?: 'asc' | 'desc';
  featured?: boolean;
  limit?: number;
}

function toQueryString(filters: RecipeFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || value === false) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  stats: () => request<Stats>('/stats'),
  categories: () => request<Category[]>('/categories'),
  ingredients: () => request<string[]>('/ingredients'),

  recipes: (filters: RecipeFilters = {}) => request<RecipeSummary[]>(`/recipes${toQueryString(filters)}`),
  recipe: (id: number) => request<Recipe>(`/recipes/${id}`),
  createRecipe: (data: RecipeInput) => request<Recipe>('/recipes', { method: 'POST', body: json(data) }),
  updateRecipe: (id: number, data: RecipeInput) =>
    request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: json(data) }),
  deleteRecipe: (id: number) => request<void>(`/recipes/${id}`, { method: 'DELETE' }),

  favorites: () => request<RecipeSummary[]>('/favorites'),
  setFavorite: (recipeId: number, favorite: boolean) =>
    request<{ recipeId: number; isFavorite: boolean }>(`/favorites/${recipeId}`, {
      method: favorite ? 'PUT' : 'DELETE',
    }),

  shoppingList: () => request<ShoppingListItem[]>('/shopping-list'),
  addShoppingItem: (data: { name: string; quantity: number | null; unit: string }) =>
    request<{ item: ShoppingListItem; merged: boolean }>('/shopping-list', { method: 'POST', body: json(data) }),
  addRecipeToShoppingList: (recipeId: number, servings?: number) =>
    request<AddFromRecipeResult>(`/shopping-list/from-recipe/${recipeId}`, {
      method: 'POST',
      body: json({ servings }),
    }),
  updateShoppingItem: (
    id: number,
    changes: Partial<{ name: string; quantity: number | null; unit: string; isChecked: boolean }>,
  ) => request<ShoppingListItem>(`/shopping-list/${id}`, { method: 'PATCH', body: json(changes) }),
  deleteShoppingItem: (id: number) => request<void>(`/shopping-list/${id}`, { method: 'DELETE' }),
  deleteCheckedItems: () => request<{ deleted: number }>('/shopping-list/checked', { method: 'DELETE' }),
  clearShoppingList: () => request<{ deleted: number }>('/shopping-list', { method: 'DELETE' }),
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Ismeretlen hiba történt.';
}
