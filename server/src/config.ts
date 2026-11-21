import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** A projekt gyökérkönyvtára (server/src/config.ts → ../../). */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const PORT = Number(process.env.PORT ?? 3001);

/** Az SQLite adatbázisfájl helye; DB_FILE környezeti változóval felülírható. */
export const DB_FILE = process.env.DB_FILE ?? path.join(PROJECT_ROOT, 'data', 'receptkonyv.db');

/** A lefordított frontend (npm run build) helye – éles módban ezt szolgálja ki a szerver. */
export const CLIENT_DIST = path.join(PROJECT_ROOT, 'dist', 'client');
