/**
 * Válaszidő-mérés: `npm run perf`
 * Ideiglenes adatbázissal saját szervert indít (a valódi adatokat nem érinti),
 * majd minden műveletet 200-szor lefuttat, és kiírja a medián / 95. percentilis / maximum értékeket.
 * A mérés a HTTP-kérés teljes körülfordulási idejét méri (localhost).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'receptkonyv-perf-'));
const PORT = 3099;
const server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'server/src/index.ts'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT), DB_FILE: path.join(tmp, 'perf.db') },
  stdio: 'ignore',
});
const cleanup = () => { server.kill(); fs.rmSync(tmp, { recursive: true, force: true }); };
process.on('exit', cleanup);
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://localhost:${PORT}/api/health`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 250));
}
console.log(`Node.js ${process.version}, ${os.cpus()[0]?.model ?? os.arch()}, ${process.platform}\n`);

const B = `http://localhost:${PORT}/api`;
const N = 200;
const j = { 'Content-Type': 'application/json' };
async function measure(label, fn) {
  for (let i = 0; i < 10; i++) await fn(i); // bemelegítés
  const t = [];
  for (let i = 0; i < N; i++) { const s = performance.now(); await fn(i); t.push(performance.now() - s); }
  t.sort((a, b) => a - b);
  const p = (q) => t[Math.min(t.length - 1, Math.floor(q * t.length))].toFixed(2);
  console.log(`| ${label} | ${p(0.5)} | ${p(0.95)} | ${t[t.length - 1].toFixed(2)} |`);
}
const ok = async (r) => { if (!r.ok) throw new Error(r.status + ' ' + await r.text()); return r; };
const recipe = { title: 'Mérés recept', description: 'x', categoryId: 2, prepTimeMinutes: 20, servings: 2, difficulty: 'konnyu', imageUrl: null, isFeatured: false,
  ingredients: Array.from({ length: 10 }, (_, i) => ({ name: 'hozzávaló ' + i, quantity: i + 1, unit: 'g' })), steps: ['a', 'b', 'c', 'd', 'e'] };
console.log('| Művelet | Medián (ms) | 95. percentilis (ms) | Maximum (ms) |');
console.log('| --- | --- | --- | --- |');
await measure('Receptlista (összes, 20 recept)', () => fetch(B + '/recipes').then(ok).then(r => r.json()));
await measure('Kombinált keresés (név + hozzávaló + szűrők)', () => fetch(B + '/recipes?q=a&ingredient=' + encodeURIComponent('tojás') + '&maxTime=60&sort=time').then(ok).then(r => r.json()));
await measure('Recept részletei', (i) => fetch(B + '/recipes/' + (1 + (i % 20))).then(ok).then(r => r.json()));
await measure('Főoldali statisztika', () => fetch(B + '/stats').then(ok).then(r => r.json()));
const ids = [];
await measure('Recept mentése (10 hozzávaló, 5 lépés)', () => fetch(B + '/recipes', { method: 'POST', headers: j, body: JSON.stringify(recipe) }).then(ok).then(r => r.json()).then(r => ids.push(r.id)));
await measure('Kedvenc jelölése', (i) => fetch(B + '/favorites/' + (1 + (i % 20)), { method: 'PUT' }).then(ok));
await measure('Recept a bevásárlólistára (összevonással)', (i) => fetch(B + '/shopping-list/from-recipe/' + (1 + (i % 20)), { method: 'POST', headers: j, body: '{}' }).then(ok).then(r => r.json()));
await measure('Recept törlése', () => fetch(B + '/recipes/' + ids.pop(), { method: 'DELETE' }).then(ok));
for (let i = 0; i < 1000; i++) {
  await fetch(B + '/recipes', { method: 'POST', headers: j, body: JSON.stringify({ ...recipe, title: 'Tömeges ' + i }) }).then(ok);
}
const n = (await fetch(B + '/stats').then(r => r.json())).totalRecipes;
console.log(`\nTerheléses adatmennyiség: ${n} recept`);
console.log('| Művelet | Medián (ms) | 95. percentilis (ms) | Maximum (ms) |');
console.log('| --- | --- | --- | --- |');
await measure(`Keresés ${n} recept között`, () => fetch(B + '/recipes?q=' + encodeURIComponent('tömeges 99')).then(ok).then(r => r.json()));
await measure(`Hozzávaló-keresés ${n} recept között`, () => fetch(B + '/recipes?ingredient=' + encodeURIComponent('darált marhahús')).then(ok).then(r => r.json()));
process.exit(0);
