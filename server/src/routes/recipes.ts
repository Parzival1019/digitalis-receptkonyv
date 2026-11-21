import { Router } from 'express';
import { recipeInputSchema, recipeQuerySchema } from '../../../shared/schemas';
import type { DB } from '../db/tx';
import { parseId, validate } from '../lib/validation';
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listIngredientNames,
  listRecipes,
  updateRecipe,
} from '../services/recipeService';

export function recipesRouter(db: DB): Router {
  const router = Router();

  // GET /api/recipes?q=&ingredient=&category=&maxTime=&difficulty=&sort=&order=&favorites=&featured=&limit=
  router.get('/', (req, res) => {
    const query = validate(recipeQuerySchema, req.query);
    res.json(listRecipes(db, query));
  });

  router.get('/:id', (req, res) => {
    res.json(getRecipe(db, parseId(req.params.id)));
  });

  router.post('/', (req, res) => {
    const data = validate(recipeInputSchema, req.body);
    res.status(201).json(createRecipe(db, data));
  });

  router.put('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const data = validate(recipeInputSchema, req.body);
    res.json(updateRecipe(db, id, data));
  });

  router.delete('/:id', (req, res) => {
    deleteRecipe(db, parseId(req.params.id));
    res.status(204).end();
  });

  return router;
}

export function ingredientsRouter(db: DB): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json(listIngredientNames(db));
  });
  return router;
}
