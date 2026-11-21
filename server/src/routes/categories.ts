import { Router } from 'express';
import { categoryInputSchema } from '../../../shared/schemas';
import type { DB } from '../db/tx';
import { parseId, validate } from '../lib/validation';
import { createCategory, deleteCategory, listCategories } from '../services/categoryService';

export function categoriesRouter(db: DB): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(listCategories(db));
  });

  router.post('/', (req, res) => {
    const data = validate(categoryInputSchema, req.body);
    res.status(201).json(createCategory(db, data));
  });

  router.delete('/:id', (req, res) => {
    deleteCategory(db, parseId(req.params.id));
    res.status(204).end();
  });

  return router;
}
