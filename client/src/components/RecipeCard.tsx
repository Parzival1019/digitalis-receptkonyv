import { ListChecks, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RecipeSummary } from '../../../shared/types';
import { DifficultyBadge, MetaItem, ServingsMeta, TimeMeta } from './Badges';
import { CategoryIcon } from './CategoryIcon';
import { FavoriteButton } from './FavoriteButton';
import { RecipeImage } from './RecipeImage';

interface RecipeCardProps {
  recipe: RecipeSummary;
  onFavoriteChange?: (id: number, isFavorite: boolean) => void;
}

export function RecipeCard({ recipe, onFavoriteChange }: RecipeCardProps) {
  return (
    <Link
      to={`/receptek/${recipe.id}`}
      className="card group flex animate-fade-in flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition duration-500 group-hover:scale-105">
          <RecipeImage imageUrl={recipe.imageUrl} title={recipe.title} category={recipe.category} />
        </div>
        <div className="absolute top-3 right-3">
          <FavoriteButton
            recipeId={recipe.id}
            isFavorite={recipe.isFavorite}
            onChange={(fav) => onFavoriteChange?.(recipe.id, fav)}
          />
        </div>
        {recipe.isFeatured && (
          <span className="chip absolute top-3 left-3 bg-white/90 text-sage-700 shadow-soft backdrop-blur">
            <Sparkles className="size-3.5" /> Kiemelt
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sage-600 uppercase">
            <CategoryIcon icon={recipe.category.icon} className="size-3.5" />
            {recipe.category.name}
          </span>
          <DifficultyBadge difficulty={recipe.difficulty} />
        </div>
        <h3 className="text-xl leading-snug font-semibold text-ink-900 transition group-hover:text-sage-700">
          {recipe.title}
        </h3>
        {recipe.description && <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{recipe.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
          <TimeMeta minutes={recipe.prepTimeMinutes} />
          <ServingsMeta servings={recipe.servings} />
          <MetaItem icon={ListChecks}>{recipe.ingredientCount} hozzávaló</MetaItem>
        </div>
      </div>
    </Link>
  );
}

export function RecipeGrid({
  recipes,
  onFavoriteChange,
}: {
  recipes: RecipeSummary[];
  onFavoriteChange?: (id: number, isFavorite: boolean) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} onFavoriteChange={onFavoriteChange} />
      ))}
    </div>
  );
}
