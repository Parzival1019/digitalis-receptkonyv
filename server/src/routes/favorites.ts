import { Router } from 'express';
import type { DB } from '../db/tx';
import { parseId } from '../lib/validation';
import { addFavorite, removeFavorite } from '../services/favoriteService';
import { listRecipes } from '../services/recipeService';

export function favoritesRouter(db: DB): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(listRecipes(db, { sort: 'name', order: 'asc', favorites: 'true' }));
  });

  // PUT: idempotens „kedvencnek jelölés”
  router.put('/:recipeId', (req, res) => {
    const recipeId = parseId(req.params.recipeId, 'receptazonosító');
    addFavorite(db, recipeId);
    res.json({ recipeId, isFavorite: true });
  });

  router.delete('/:recipeId', (req, res) => {
    const recipeId = parseId(req.params.recipeId, 'receptazonosító');
    removeFavorite(db, recipeId);
    res.json({ recipeId, isFavorite: false });
  });

  return router;
}
