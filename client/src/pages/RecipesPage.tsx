import { ArrowDownAZ, ArrowUpAZ, Carrot, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DIFFICULTIES, DIFFICULTY_LABELS, TIME_FILTERS } from '../../../shared/constants';
import { RecipeGrid } from '../components/RecipeCard';
import { EmptyState, ErrorState, RecipeGridSkeleton } from '../components/States';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { api, errorMessage, type RecipeFilters } from '../lib/api';
import { formatDuration } from '../lib/format';

const SORT_OPTIONS = [
  { value: 'name', label: 'Név szerint' },
  { value: 'time', label: 'Elkészítési idő szerint' },
  { value: 'newest', label: 'Legújabb elöl' },
] as const;

/**
 * Receptlista keresővel és szűrőkkel. A feltételek az URL query-paramétereiben
 * tárolódnak, így a szűrt nézet könyvjelzőzhető és a vissza gomb is működik.
 */
export function RecipesPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [ingredient, setIngredient] = useState(params.get('ingredient') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQ = useDebounced(q);
  const debouncedIngredient = useDebounced(ingredient);

  const category = params.get('category') ?? '';
  const maxTime = params.get('maxTime') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const sort = (params.get('sort') ?? 'name') as NonNullable<RecipeFilters['sort']>;
  const order = (params.get('order') ?? 'asc') as 'asc' | 'desc';

  function setParam(key: string, value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  // A szövegmezők késleltetve kerülnek az URL-be (gépelés közben nem villog a lista).
  useEffect(() => setParam('q', debouncedQ.trim()), [debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setParam('ingredient', debouncedIngredient.trim()), [debouncedIngredient]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: RecipeFilters = {
    q: params.get('q') ?? '',
    ingredient: params.get('ingredient') ?? '',
    category,
    maxTime,
    difficulty,
    sort,
    order,
  };
  const recipes = useAsync(() => api.recipes(filters), [JSON.stringify(filters)]);
  const categories = useAsync(() => api.categories(), []);

  const activeCount = [filters.q, filters.ingredient, category, maxTime, difficulty].filter(Boolean).length;

  function resetFilters() {
    setQ('');
    setIngredient('');
    setParams({}, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Receptek</h1>
          <p className="mt-1 text-ink-500">Keress név vagy hozzávaló alapján, és szűkítsd a találatokat.</p>
        </div>
        <Link to="/receptek/uj" className="btn-primary self-start">
          <Plus className="size-4" /> Új recept
        </Link>
      </div>

      {/* Kereső- és szűrőpanel */}
      <div className="card space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="relative block">
            <span className="sr-only">Keresés receptnévre</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-10"
              placeholder="Recept neve, pl. carbonara"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Keresés hozzávalók alapján</span>
            <Carrot className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-10"
              placeholder="Hozzávalók vesszővel, pl. tojás, tej"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 md:hidden">
          <button className="btn-secondary" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal className="size-4" /> Szűrők {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>

        <div className={`${showFilters ? 'grid' : 'hidden'} gap-3 sm:grid-cols-2 md:grid md:grid-cols-4`}>
          <Select label="Kategória" value={category} onChange={(v) => setParam('category', v)}>
            <option value="">Összes kategória</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.recipeCount})
              </option>
            ))}
          </Select>
          <Select label="Elkészítési idő" value={maxTime} onChange={(v) => setParam('maxTime', v)}>
            <option value="">Bármennyi</option>
            {TIME_FILTERS.map((t) => (
              <option key={t} value={t}>
                Legfeljebb {formatDuration(t)}
              </option>
            ))}
          </Select>
          <Select label="Nehézség" value={difficulty} onChange={(v) => setParam('difficulty', v)}>
            <option value="">Bármilyen</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </Select>
          <div>
            <span className="label">Rendezés</span>
            <div className="flex gap-2">
              <select
                className="input"
                value={sort}
                onChange={(e) => setParam('sort', e.target.value === 'name' ? '' : e.target.value)}
                aria-label="Rendezés"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                className="btn-secondary px-3"
                onClick={() => setParam('order', order === 'asc' ? 'desc' : '')}
                aria-label={order === 'asc' ? 'Növekvő sorrend (váltás csökkenőre)' : 'Csökkenő sorrend (váltás növekvőre)'}
                title={order === 'asc' ? 'Növekvő' : 'Csökkenő'}
              >
                {order === 'asc' ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-cream-200 pt-3 text-sm">
            <span className="text-ink-500">
              {recipes.data ? `${recipes.data.length} találat` : 'Keresés…'}
            </span>
            <button onClick={resetFilters} className="chip bg-cream-200 text-ink-700 hover:bg-cream-300">
              <X className="size-3.5" /> Szűrők törlése
            </button>
          </div>
        )}
      </div>

      {recipes.error ? (
        <ErrorState message={errorMessage(recipes.error)} onRetry={recipes.reload} />
      ) : !recipes.data ? (
        <RecipeGridSkeleton />
      ) : recipes.data.length === 0 ? (
        <EmptyState
          title="Nincs a feltételeknek megfelelő recept"
          description="Próbálj más kulcsszót, vagy lazíts a szűrőkön."
          action={
            <button className="btn-secondary" onClick={resetFilters}>
              Szűrők törlése
            </button>
          }
        />
      ) : (
        <div className={recipes.loading ? 'opacity-60 transition' : 'transition'}>
          <RecipeGrid
            recipes={recipes.data}
            onFavoriteChange={(id, fav) =>
              recipes.setData((list) => list?.map((r) => (r.id === id ? { ...r, isFavorite: fav } : r)))
            }
          />
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}
