import { ArrowRight, BookOpen, Heart, Plus, Search, ShoppingBasket, Sparkles, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryIcon, categoryTone } from '../components/CategoryIcon';
import { RecipeGrid } from '../components/RecipeCard';
import { ErrorState, RecipeGridSkeleton } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { api, errorMessage } from '../lib/api';
import { useAppData } from '../lib/AppData';

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { stats } = useAppData();
  const featured = useAsync(() => api.recipes({ featured: true, limit: 6 }), []);
  const categories = useAsync(() => api.categories(), []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/receptek?q=${encodeURIComponent(q)}` : '/receptek');
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-700 via-sage-600 to-sage-500 px-6 py-10 text-white shadow-lift sm:px-10 sm:py-14">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-20 size-48 rounded-full bg-white/5" />
        <div className="relative max-w-2xl">
          <span className="chip bg-white/15 text-white backdrop-blur">
            <Sparkles className="size-3.5" /> {stats ? `${stats.totalRecipes} recept a gyűjteményben` : 'Receptgyűjtemény'}
          </span>
          <h1 className="mt-4 text-3xl leading-tight font-semibold sm:text-5xl">Mit főzzünk ma?</h1>
          <p className="mt-3 max-w-lg text-base text-sage-50/90 sm:text-lg">
            Böngészd a receptjeidet, jelöld meg a kedvenceidet, és állíts össze bevásárlólistát egyetlen kattintással.
          </p>
          <form onSubmit={onSearch} className="mt-7 flex flex-col gap-2 sm:flex-row" role="search">
            <label className="relative flex-1">
              <span className="sr-only">Keresés receptek között</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés receptnévre, pl. gulyás…"
                className="w-full rounded-xl border-0 bg-white py-3.5 pr-4 pl-12 text-ink-900 shadow-soft placeholder:text-ink-400 focus:ring-4 focus:ring-white/30 focus:outline-none"
              />
            </label>
            <button type="submit" className="btn bg-ink-900 px-6 py-3.5 text-white hover:bg-ink-700">
              Keresés
            </button>
          </form>
        </div>
      </section>

      {/* Gyors elérés */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickCard to="/receptek" icon={BookOpen} title="Összes recept" value={stats?.totalRecipes} tone="bg-sage-50 text-sage-700" />
        <QuickCard to="/kedvencek" icon={Heart} title="Kedvencek" value={stats?.favoriteCount} tone="bg-rose-50 text-rose-600" />
        <QuickCard
          to="/bevasarlolista"
          icon={ShoppingBasket}
          title="Bevásárlólista"
          value={stats?.shoppingListOpenCount}
          suffix="tétel"
          tone="bg-amber-50 text-amber-700"
        />
        <Link
          to="/receptek/uj"
          className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-sage-300 bg-sage-50/60 p-5 transition hover:border-sage-500 hover:bg-sage-50"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-sage-600 text-white shadow-soft transition group-hover:scale-110">
            <Plus className="size-6" />
          </span>
          <span>
            <span className="block font-semibold text-ink-900">Új recept hozzáadása</span>
            <span className="text-sm text-ink-500">Saját recept rögzítése</span>
          </span>
        </Link>
      </section>

      {/* Kategóriák */}
      <section>
        <SectionHeader title="Kategóriák" to="/receptek" linkLabel="Összes recept" />
        {categories.error ? (
          <ErrorState message={errorMessage(categories.error)} onRetry={categories.reload} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(categories.data ?? Array.from({ length: 6 }, () => null)).map((c, i) =>
              c ? (
                <Link
                  key={c.id}
                  to={`/receptek?category=${c.slug}`}
                  className={`group flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift ${categoryTone(c.slug)}`}
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/70 transition group-hover:scale-110">
                    <CategoryIcon icon={c.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-900">{c.name}</span>
                    <span className="text-xs text-ink-500">{c.recipeCount} recept</span>
                  </span>
                </Link>
              ) : (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-cream-200" />
              ),
            )}
          </div>
        )}
      </section>

      {/* Kiemelt receptek */}
      <section>
        <SectionHeader title="Kiemelt receptek" to="/receptek" linkLabel="Továbbiak" />
        {featured.error ? (
          <ErrorState message={errorMessage(featured.error)} onRetry={featured.reload} />
        ) : featured.loading && !featured.data ? (
          <RecipeGridSkeleton count={3} />
        ) : (
          <RecipeGrid
            recipes={featured.data ?? []}
            onFavoriteChange={(id, fav) =>
              featured.setData((list) => list?.map((r) => (r.id === id ? { ...r, isFavorite: fav } : r)))
            }
          />
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, to, linkLabel }: { title: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h2>
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-sage-700 hover:text-sage-800">
        {linkLabel} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function QuickCard({
  to,
  icon: Icon,
  title,
  value,
  suffix = '',
  tone,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  value: number | undefined;
  suffix?: string;
  tone: string;
}) {
  return (
    <Link to={to} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <span className={`flex size-12 items-center justify-center rounded-xl ${tone} transition group-hover:scale-110`}>
        <Icon className="size-6" />
      </span>
      <span>
        <span className="block text-sm text-ink-500">{title}</span>
        <span className="font-display text-2xl font-semibold text-ink-900">
          {value ?? '–'} {suffix && <span className="text-sm font-normal text-ink-500">{suffix}</span>}
        </span>
      </span>
    </Link>
  );
}
