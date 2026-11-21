import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Recipe, RecipeSummary } from '../shared/types';
import { sampleRecipe, setup } from './helpers';

let ctx: ReturnType<typeof setup>;
beforeEach(() => {
  ctx = setup();
});

describe('seedelés', () => {
  it('legalább 15 mintarecept és 6 kategória kerül az adatbázisba', async () => {
    const res = await request(ctx.app).get('/api/stats').expect(200);
    expect(res.body.totalRecipes).toBeGreaterThanOrEqual(15);
    expect(res.body.categoryCount).toBe(6);
  });

  it('a kötelező mintareceptek szerepelnek, hozzávalókkal és lépésekkel', async () => {
    const res = await request(ctx.app).get('/api/recipes').expect(200);
    const titles = (res.body as RecipeSummary[]).map((r) => r.title);
    for (const t of ['Bolognai spagetti', 'Carbonara', 'Csirkepaprikás', 'Gulyásleves', 'Rántott csirkemell',
      'Cézársaláta', 'Palacsinta', 'Zabkása', 'Lasagne', 'Paradicsomleves']) {
      expect(titles).toContain(t);
    }
    const detail = await request(ctx.app).get(`/api/recipes/${res.body[0].id}`).expect(200);
    expect(detail.body.ingredients.length).toBeGreaterThan(0);
    expect(detail.body.steps.length).toBeGreaterThan(0);
  });
});

describe('recept CRUD', () => {
  it('létrehozás → 201, az adatok visszaolvashatók', async () => {
    const input = sampleRecipe(ctx.db);
    const res = await request(ctx.app).post('/api/recipes').send(input).expect(201);
    const created = res.body as Recipe;
    expect(created.id).toBeTypeOf('number');
    expect(created.title).toBe(input.title);
    expect(created.category.slug).toBe('tesztak');
    expect(created.ingredients.map((i) => [i.name, i.quantity, i.unit])).toEqual([
      ['Penne', 250, 'g'],
      ['Tojás', 2, 'db'],
      ['Só', null, ''],
    ]);
    expect(created.steps.map((s) => s.stepNumber)).toEqual([1, 2, 3]);
    expect(created.createdAt).toBe(created.updatedAt);

    const fetched = await request(ctx.app).get(`/api/recipes/${created.id}`).expect(200);
    expect(fetched.body).toEqual(created);
  });

  it('a meglévő hozzávalót újrahasznosítja (tojás nem duplikálódik a törzsben)', async () => {
    const before = (ctx.db.prepare("SELECT COUNT(*) n FROM ingredients WHERE normalized_name = 'tojás'").get() as { n: number }).n;
    await request(ctx.app).post('/api/recipes').send(sampleRecipe(ctx.db)).expect(201);
    const after = (ctx.db.prepare("SELECT COUNT(*) n FROM ingredients WHERE normalized_name = 'tojás'").get() as { n: number }).n;
    expect(before).toBe(1);
    expect(after).toBe(1);
  });

  it('módosítás → minden mező, hozzávaló és lépés frissül', async () => {
    const created = (await request(ctx.app).post('/api/recipes').send(sampleRecipe(ctx.db)).expect(201)).body as Recipe;
    await new Promise((r) => setTimeout(r, 5));
    const updatedInput = sampleRecipe(ctx.db, {
      title: 'Átnevezett recept',
      prepTimeMinutes: 50,
      difficulty: 'nehez',
      ingredients: [{ name: 'Rizs', quantity: 1.5, unit: 'bögre' }],
      steps: ['Egyetlen lépés.'],
    });
    const res = await request(ctx.app).put(`/api/recipes/${created.id}`).send(updatedInput).expect(200);
    expect(res.body.title).toBe('Átnevezett recept');
    expect(res.body.prepTimeMinutes).toBe(50);
    expect(res.body.difficulty).toBe('nehez');
    expect(res.body.ingredients).toHaveLength(1);
    expect(res.body.ingredients[0]).toMatchObject({ name: 'Rizs', quantity: 1.5, unit: 'bögre' });
    expect(res.body.steps).toEqual([{ stepNumber: 1, instruction: 'Egyetlen lépés.' }]);
    expect(res.body.updatedAt > created.updatedAt).toBe(true);
    expect(res.body.createdAt).toBe(created.createdAt);
  });

  it('törlés → 204, utána 404, a kapcsolódó sorok is törlődnek (CASCADE)', async () => {
    const created = (await request(ctx.app).post('/api/recipes').send(sampleRecipe(ctx.db)).expect(201)).body as Recipe;
    await request(ctx.app).put(`/api/favorites/${created.id}`).expect(200);
    await request(ctx.app).delete(`/api/recipes/${created.id}`).expect(204);
    await request(ctx.app).get(`/api/recipes/${created.id}`).expect(404);
    const leftovers = ctx.db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = ?) +
                (SELECT COUNT(*) FROM recipe_steps WHERE recipe_id = ?) +
                (SELECT COUNT(*) FROM favorites WHERE recipe_id = ?) AS n`,
      )
      .get(created.id, created.id, created.id) as { n: number };
    expect(leftovers.n).toBe(0);
  });

  it('nem létező recept módosítása és törlése 404', async () => {
    await request(ctx.app).put('/api/recipes/99999').send(sampleRecipe(ctx.db)).expect(404);
    const res = await request(ctx.app).delete('/api/recipes/99999').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('érvénytelen bemenetek', () => {
  it('hiányzó/hibás mezők → 400 mezőnkénti hibaüzenetekkel', async () => {
    const res = await request(ctx.app)
      .post('/api/recipes')
      .send({ title: 'A', prepTimeMinutes: -5, servings: 0, difficulty: 'extrém', ingredients: [], steps: [] })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['title', 'categoryId', 'prepTimeMinutes', 'servings', 'difficulty', 'ingredients', 'steps']));
  });

  it('negatív hozzávaló-mennyiség és üres lépés → 400', async () => {
    const res = await request(ctx.app)
      .post('/api/recipes')
      .send(sampleRecipe(ctx.db, { ingredients: [{ name: 'Liszt', quantity: -1, unit: 'g' }], steps: ['  '] }))
      .expect(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['ingredients.0.quantity', 'steps.0']));
  });

  it('nem létező kategória → 400', async () => {
    const res = await request(ctx.app).post('/api/recipes').send(sampleRecipe(ctx.db, { categoryId: 999 })).expect(400);
    expect(res.body.error.details[0].path).toBe('categoryId');
  });

  it('érvénytelen kép-URL → 400', async () => {
    await request(ctx.app).post('/api/recipes').send(sampleRecipe(ctx.db, { imageUrl: 'javascript:alert(1)' })).expect(400);
  });

  it('hibás JSON → 400 INVALID_JSON', async () => {
    const res = await request(ctx.app)
      .post('/api/recipes')
      .set('Content-Type', 'application/json')
      .send('{"title": ')
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('érvénytelen azonosító → 400, ismeretlen végpont → 404', async () => {
    await request(ctx.app).get('/api/recipes/abc').expect(400);
    await request(ctx.app).get('/api/nincs-ilyen').expect(404);
  });

  it('érvénytelen szűrőparaméter → 400', async () => {
    await request(ctx.app).get('/api/recipes?difficulty=extrem').expect(400);
    await request(ctx.app).get('/api/recipes?maxTime=sok').expect(400);
  });
});

describe('kategóriák', () => {
  it('lista receptszámokkal; létrehozás; foglalt név → 409; használt kategória nem törölhető', async () => {
    const list = await request(ctx.app).get('/api/categories').expect(200);
    expect(list.body[0]).toMatchObject({ name: 'Levesek', slug: 'levesek' });
    expect(list.body[0].recipeCount).toBeGreaterThan(0);

    const created = await request(ctx.app).post('/api/categories').send({ name: 'Köretek', icon: 'utensils' }).expect(201);
    expect(created.body.slug).toBe('koretek');
    await request(ctx.app).post('/api/categories').send({ name: 'Köretek' }).expect(409);
    await request(ctx.app).delete(`/api/categories/${created.body.id}`).expect(204);
    await request(ctx.app).delete(`/api/categories/${list.body[0].id}`).expect(409);
  });
});
