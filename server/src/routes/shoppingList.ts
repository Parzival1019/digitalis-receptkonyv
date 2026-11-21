import { Router } from 'express';
import { addFromRecipeSchema, shoppingItemCreateSchema, shoppingItemUpdateSchema } from '../../../shared/schemas';
import type { DB } from '../db/tx';
import { parseId, validate } from '../lib/validation';
import {
  addFromRecipe,
  addOrMergeItem,
  clearList,
  deleteCheckedItems,
  deleteItem,
  listItems,
  updateItem,
} from '../services/shoppingListService';

export function shoppingListRouter(db: DB): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(listItems(db));
  });

  // Kézi tétel felvétele (azonos név + mértékegység esetén összevonással)
  router.post('/', (req, res) => {
    const data = validate(shoppingItemCreateSchema, req.body);
    const { item, merged } = addOrMergeItem(db, data);
    res.status(merged ? 200 : 201).json({ item, merged });
  });

  // Egy recept összes hozzávalójának hozzáadása egyetlen kéréssel
  router.post('/from-recipe/:recipeId', (req, res) => {
    const recipeId = parseId(req.params.recipeId, 'receptazonosító');
    const { servings } = validate(addFromRecipeSchema, req.body ?? {});
    res.json(addFromRecipe(db, recipeId, servings));
  });

  // Fontos: a fix útvonalak (/checked) a paraméteres (/:id) előtt szerepelnek.
  router.delete('/checked', (_req, res) => {
    res.json({ deleted: deleteCheckedItems(db) });
  });

  router.delete('/', (_req, res) => {
    res.json({ deleted: clearList(db) });
  });

  router.patch('/:id', (req, res) => {
    const id = parseId(req.params.id, 'tételazonosító');
    const changes = validate(shoppingItemUpdateSchema, req.body);
    res.json(updateItem(db, id, changes));
  });

  router.delete('/:id', (req, res) => {
    deleteItem(db, parseId(req.params.id, 'tételazonosító'));
    res.status(204).end();
  });

  return router;
}
