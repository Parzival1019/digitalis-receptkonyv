/**
 * A frontend és a backend által közösen használt adattípusok.
 * Az API válaszai pontosan ezeknek a típusoknak felelnek meg.
 */

export type Difficulty = 'konnyu' | 'kozepes' | 'nehez';

export interface Category {
  id: number;
  name: string;
  slug: string;
  /** Lucide ikon azonosítója (pl. "soup"). */
  icon: string;
  recipeCount: number;
}

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface RecipeIngredient {
  id: number;
  ingredientId: number;
  name: string;
  /** null, ha a mennyiség nem meghatározott (pl. „ízlés szerint”). */
  quantity: number | null;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface RecipeSummary {
  id: number;
  title: string;
  description: string;
  category: CategoryRef;
  prepTimeMinutes: number;
  servings: number;
  difficulty: Difficulty;
  imageUrl: string | null;
  isFeatured: boolean;
  isFavorite: boolean;
  ingredientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number | null;
  unit: string;
  isChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddFromRecipeResult {
  recipeId: number;
  added: number;
  merged: number;
  items: ShoppingListItem[];
}

export interface Stats {
  totalRecipes: number;
  favoriteCount: number;
  categoryCount: number;
  shoppingListOpenCount: number;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}
