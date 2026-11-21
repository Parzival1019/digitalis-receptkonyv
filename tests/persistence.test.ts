import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/src/app';
import { openDatabase } from '../server/src/db/connection';
import { sampleRecipe } from './helpers';

const tmpDirs: string[] = [];
function tempDbFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'receptkonyv-test-'));
  tmpDirs.push(dir);
  return path.join(dir, 'test.db');
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe('adatmegmaradás újraindítás után (fájl alapú SQLite)', () => {
  it('az adatok megmaradnak, a seed nem duplikálódik', async () => {
    const file = tempDbFile();

    // 1. „indítás”: adatok létrehozása
    let db = openDatabase(file);
    let app = createApp(db);
    const seededCount = (await request(app).get('/api/stats')).body.totalRecipes;
    const created = await request(app).post('/api/recipes').send(sampleRecipe(db)).expect(201);
    await request(app).put(`/api/favorites/${created.body.id}`).expect(200);
    await request(app).post(`/api/shopping-list/from-recipe/${created.body.id}`).expect(200);
    await request(app).delete('/api/recipes/1').expect(204);
    db.close();

    // 2. „újraindítás”: ugyanaz a fájl újra megnyitva
    db = openDatabase(file);
    app = createApp(db);
    const stats = (await request(app).get('/api/stats').expect(200)).body;
    expect(stats.totalRecipes).toBe(seededCount); // +1 új, -1 törölt, seed nem fut újra
    expect(stats.favoriteCount).toBe(1);
    expect(stats.shoppingListOpenCount).toBe(3);
    const recipe = await request(app).get(`/api/recipes/${created.body.id}`).expect(200);
    expect(recipe.body.title).toBe('Teszt rakott tészta');
    expect(recipe.body.isFavorite).toBe(true);
    await request(app).get('/api/recipes/1').expect(404); // törölt mintarecept nem „támad fel”
    db.close();

    // 3. harmadik indítás: továbbra sincs duplikáció
    db = openDatabase(file);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number };
    expect(n).toBe(6);
    db.close();
  });
});
