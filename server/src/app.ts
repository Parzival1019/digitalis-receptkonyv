import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import type { ApiErrorBody } from '../../shared/types';
import { CLIENT_DIST } from './config';
import type { DB } from './db/tx';
import { HttpError } from './lib/errors';
import { categoriesRouter } from './routes/categories';
import { favoritesRouter } from './routes/favorites';
import { ingredientsRouter, recipesRouter } from './routes/recipes';
import { shoppingListRouter } from './routes/shoppingList';
import { getStats } from './services/statsService';

/**
 * Express alkalmazás létrehozása. Az adatbázist paraméterként kapja, így a
 * tesztek memóriában futó, elszigetelt adatbázissal tudják használni.
 */
export function createApp(db: DB, options: { serveClient?: boolean } = {}) {
  const app = express();

  app.use(cors());
  // A kép feltöltése base64 adat-URL-ként történik, ezért nagyobb a limit.
  app.use(express.json({ limit: '6mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/api/stats', (_req, res) => {
    res.json(getStats(db));
  });
  app.use('/api/recipes', recipesRouter(db));
  app.use('/api/ingredients', ingredientsRouter(db));
  app.use('/api/categories', categoriesRouter(db));
  app.use('/api/favorites', favoritesRouter(db));
  app.use('/api/shopping-list', shoppingListRouter(db));

  // Ismeretlen API-útvonal → 404 JSON
  app.use('/api', (req, res) => {
    const body: ApiErrorBody = {
      error: { code: 'NOT_FOUND', message: `Nem létező végpont: ${req.method} ${req.originalUrl}` },
    };
    res.status(404).json(body);
  });

  // Éles módban (npm run build után) a szerver szolgálja ki a frontendet is.
  if (options.serveClient && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}

/** Egységes, strukturált hibaválasz minden hibatípusra. */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Váratlan szerverhiba történt.' } };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    body = { error: { code: 'INVALID_JSON', message: 'A kérés törzse nem érvényes JSON.' } };
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    body = { error: { code: 'PAYLOAD_TOO_LARGE', message: 'A kérés túl nagy (pl. túl nagy a kép).' } };
  } else {
    console.error(err);
  }

  res.status(status).json(body);
};
