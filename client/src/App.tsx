import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeFormPage } from './pages/RecipeFormPage';
import { RecipesPage } from './pages/RecipesPage';
import { ShoppingListPage } from './pages/ShoppingListPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="receptek" element={<RecipesPage />} />
        <Route path="receptek/uj" element={<RecipeFormPage />} />
        <Route path="receptek/:id" element={<RecipeDetailPage />} />
        <Route path="receptek/:id/szerkesztes" element={<RecipeFormPage />} />
        <Route path="kedvencek" element={<FavoritesPage />} />
        <Route path="bevasarlolista" element={<ShoppingListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
