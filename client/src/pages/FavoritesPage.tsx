import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecipeGrid } from '../components/RecipeCard';
import { EmptyState, ErrorState, RecipeGridSkeleton } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { api, errorMessage } from '../lib/api';

export function FavoritesPage() {
  const favorites = useAsync(() => api.favorites(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Kedvencek</h1>
        <p className="mt-1 text-ink-500">
          {favorites.data?.length ? `${favorites.data.length} kedvenc recept` : 'A szívvel megjelölt receptjeid egy helyen.'}
        </p>
      </div>

      {favorites.error ? (
        <ErrorState message={errorMessage(favorites.error)} onRetry={favorites.reload} />
      ) : !favorites.data ? (
        <RecipeGridSkeleton count={3} />
      ) : favorites.data.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Még nincs kedvenc recepted"
          description="Egy recept kártyáján vagy oldalán a szív ikonra kattintva jelölheted kedvencnek."
          action={<Link to="/receptek" className="btn-primary">Receptek böngészése</Link>}
        />
      ) : (
        <RecipeGrid
          recipes={favorites.data}
          // Kedvencből való eltávolításkor a kártya azonnal eltűnik a listáról.
          onFavoriteChange={(id, fav) =>
            favorites.setData((list) =>
              fav ? list : list?.filter((r) => r.id !== id),
            )
          }
        />
      )}
    </div>
  );
}
