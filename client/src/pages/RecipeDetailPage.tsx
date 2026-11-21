import { ArrowLeft, CalendarDays, Loader2, Minus, Pencil, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { scaleQuantity } from '../../../shared/text';
import { DifficultyBadge, ServingsMeta, TimeMeta } from '../components/Badges';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FavoriteButton } from '../components/FavoriteButton';
import { RecipeImage } from '../components/RecipeImage';
import { EmptyState, ErrorState, Spinner } from '../components/States';
import { useToast } from '../components/Toast';
import { useAsync } from '../hooks/useAsync';
import { api, ApiError, errorMessage } from '../lib/api';
import { useAppData } from '../lib/AppData';
import { formatAmount, formatDate } from '../lib/format';

export function RecipeDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshStats } = useAppData();
  const recipe = useAsync(() => api.recipe(id), [id]);
  const [servings, setServings] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (recipe.loading && !recipe.data) return <Spinner label="Recept betöltése…" />;
  if (recipe.error) {
    if (recipe.error instanceof ApiError && recipe.error.status === 404) {
      return (
        <EmptyState
          title="A recept nem található"
          description="Lehet, hogy időközben törölték."
          action={<Link to="/receptek" className="btn-primary">Vissza a receptekhez</Link>}
        />
      );
    }
    return <ErrorState message={errorMessage(recipe.error)} onRetry={recipe.reload} />;
  }
  const r = recipe.data!;
  const currentServings = servings ?? r.servings;

  async function addToShoppingList() {
    setAdding(true);
    try {
      const result = await api.addRecipeToShoppingList(r.id, currentServings);
      const parts = [`${result.added} új tétel`];
      if (result.merged) parts.push(`${result.merged} összevonva`);
      toast.success(`Hozzávalók a bevásárlólistán (${parts.join(', ')}).`);
      refreshStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function deleteRecipe() {
    setDeleting(true);
    try {
      await api.deleteRecipe(r.id);
      toast.success(`„${r.title}” törölve.`);
      refreshStats();
      navigate('/receptek', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <article className="animate-fade-in space-y-8">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2 px-2">
        <ArrowLeft className="size-4" /> Vissza
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lift lg:col-span-2">
          <RecipeImage imageUrl={r.imageUrl} title={r.title} category={r.category} iconClassName="size-24" />
        </div>

        <div className="flex flex-col lg:col-span-3">
          <Link
            to={`/receptek?category=${r.category.slug}`}
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold tracking-wide text-sage-600 uppercase hover:text-sage-800"
          >
            <CategoryIcon icon={r.category.icon} className="size-4" /> {r.category.name}
          </Link>
          <h1 className="mt-2 text-3xl leading-tight font-semibold text-ink-900 sm:text-5xl">{r.title}</h1>
          {r.description && <p className="mt-3 text-lg leading-relaxed text-ink-600">{r.description}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <TimeMeta minutes={r.prepTimeMinutes} />
            <ServingsMeta servings={r.servings} />
            <DifficultyBadge difficulty={r.difficulty} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={addToShoppingList} disabled={adding}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBasket className="size-4" />}
              Bevásárlólistára
            </button>
            <FavoriteButton
              variant="full"
              recipeId={r.id}
              isFavorite={r.isFavorite}
              onChange={(fav) => recipe.setData((d) => d && { ...d, isFavorite: fav })}
            />
            <Link to={`/receptek/${r.id}/szerkesztes`} className="btn-secondary">
              <Pencil className="size-4" /> Szerkesztés
            </Link>
            <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="size-4" /> Törlés
            </button>
          </div>

          <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-6 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" /> Létrehozva: {formatDate(r.createdAt)}
            </span>
            {r.updatedAt !== r.createdAt && <span>Módosítva: {formatDate(r.updatedAt)}</span>}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Hozzávalók */}
        <section className="card h-fit p-6 lg:sticky lg:top-24 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Hozzávalók</h2>
            <div className="flex items-center gap-1 rounded-xl border border-cream-300 p-1" aria-label="Adagok száma">
              <button
                className="flex size-8 items-center justify-center rounded-lg hover:bg-cream-200 disabled:opacity-40"
                onClick={() => setServings(Math.max(1, currentServings - 1))}
                disabled={currentServings <= 1}
                aria-label="Kevesebb adag"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-16 text-center text-sm font-semibold" aria-live="polite">
                {currentServings} adag
              </span>
              <button
                className="flex size-8 items-center justify-center rounded-lg hover:bg-cream-200 disabled:opacity-40"
                onClick={() => setServings(Math.min(100, currentServings + 1))}
                disabled={currentServings >= 100}
                aria-label="Több adag"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          {currentServings !== r.servings && (
            <p className="mb-3 rounded-lg bg-sage-50 px-3 py-2 text-xs text-sage-800">
              A mennyiségek {currentServings} adagra átszámítva (eredeti: {r.servings} adag).
            </p>
          )}
          <ul className="divide-y divide-cream-200">
            {r.ingredients.map((ing) => (
              <li key={ing.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-ink-800">{ing.name}</span>
                <span className="shrink-0 text-right text-sm font-semibold text-ink-600 tabular-nums">
                  {formatAmount(scaleQuantity(ing.quantity, r.servings, currentServings), ing.unit)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Lépések */}
        <section className="card p-6 lg:col-span-3">
          <h2 className="mb-5 text-2xl font-semibold">Elkészítés</h2>
          <ol className="space-y-5">
            {r.steps.map((step) => (
              <li key={step.stepNumber} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-600 font-display text-sm font-semibold text-white">
                  {step.stepNumber}
                </span>
                <p className="pt-1.5 leading-relaxed text-ink-700">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Recept törlése"
        message={`Biztosan törlöd a(z) „${r.title}” receptet? A művelet nem vonható vissza.`}
        loading={deleting}
        onConfirm={deleteRecipe}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
