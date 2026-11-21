import { createApp } from './app';
import { DB_FILE, PORT } from './config';
import { openDatabase } from './db/connection';

const db = openDatabase(DB_FILE);
const app = createApp(db, { serveClient: true });

const server = app.listen(PORT, () => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM recipes').get() as { count: number };
  console.log(`🍳 Digitális receptkönyv API: http://localhost:${PORT}/api`);
  console.log(`   Adatbázis: ${DB_FILE} (${count} recept)`);
});

// Leállításkor szabályosan lezárjuk az adatbázist.
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
