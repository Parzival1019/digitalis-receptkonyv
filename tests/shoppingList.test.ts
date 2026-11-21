import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ShoppingListItem } from '../shared/types';
import { setup } from './helpers';

let ctx: ReturnType<typeof setup>;
beforeEach(() => {
  ctx = setup();
});

function idByTitle(title: string): number {
  return (ctx.db.prepare('SELECT id FROM recipes WHERE title = ?').get(title) as { id: number }).id;
}

async function getList(): Promise<ShoppingListItem[]> {
  return (await request(ctx.app).get('/api/shopping-list').expect(200)).body;
}

const find = (items: ShoppingListItem[], name: string) => items.filter((i) => i.name.toLowerCase() === name);

describe('bevásárlólista – recept hozzáadása', () => {
  it('egy gombnyomással minden hozzávaló a listára kerül', async () => {
    const id = idByTitle('Bolognai spagetti');
    const res = await request(ctx.app).post(`/api/shopping-list/from-recipe/${id}`).send({}).expect(200);
    expect(res.body.added).toBe(13);
    expect(res.body.merged).toBe(0);
    expect(res.body.items).toHaveLength(13);
    expect(find(res.body.items, 'spagetti')[0]).toMatchObject({ quantity: 400, unit: 'g', isChecked: false });
  });

  it('azonos hozzávaló + azonos mértékegység esetén összevonja a mennyiséget', async () => {
    await request(ctx.app).post(`/api/shopping-list/from-recipe/${idByTitle('Bolognai spagetti')}`).expect(200);
    const res = await request(ctx.app).post(`/api/shopping-list/from-recipe/${idByTitle('Carbonara')}`).expect(200);
    expect(res.body.merged).toBeGreaterThanOrEqual(3); // spagetti, parmezán, só
    const items = await getList();
    expect(find(items, 'spagetti')).toHaveLength(1);
    expect(find(items, 'spagetti')[0].quantity).toBe(800);
    expect(find(items, 'parmezán')[0].quantity).toBe(70);
    expect(find(items, 'só')).toHaveLength(1); // ízlés szerint + ízlés szerint
    expect(find(items, 'só')[0].quantity).toBeNull();
  });

  it('különböző mértékegységeket nem ad össze', async () => {
    await request(ctx.app).post(`/api/shopping-list/from-recipe/${idByTitle('Csirkepaprikás')}`).expect(200); // 2 ek
    await request(ctx.app).post(`/api/shopping-list/from-recipe/${idByTitle('Lecsó')}`).expect(200); // 1 tk
    const paprika = find(await getList(), 'pirospaprika');
    expect(paprika).toHaveLength(2);
    expect(paprika.map((p) => `${p.quantity} ${p.unit}`).sort()).toEqual(['1 tk', '2 ek']);
  });

  it('ugyanaz a recept kétszer → minden mennyiség duplázódik, új sor nem keletkezik', async () => {
    const id = idByTitle('Palacsinta');
    await request(ctx.app).post(`/api/shopping-list/from-recipe/${id}`).expect(200);
    const res = await request(ctx.app).post(`/api/shopping-list/from-recipe/${id}`).expect(200);
    expect(res.body.added).toBe(0);
    expect(find(res.body.items, 'tej')[0].quantity).toBe(10);
  });

  it('adagszám szerinti átszámítás', async () => {
    const id = idByTitle('Bolognai spagetti'); // 4 adag
    await request(ctx.app).post(`/api/shopping-list/from-recipe/${id}`).send({ servings: 2 }).expect(200);
    expect(find(await getList(), 'darált marhahús')[0].quantity).toBe(250);
  });

  it('kipipált tételhez nem ad hozzá, hanem új sort nyit', async () => {
    const created = await request(ctx.app).post('/api/shopping-list').send({ name: 'Tej', quantity: 1, unit: 'l' }).expect(201);
    await request(ctx.app).patch(`/api/shopping-list/${created.body.item.id}`).send({ isChecked: true }).expect(200);
    await request(ctx.app).post('/api/shopping-list').send({ name: 'tej', quantity: 1, unit: 'l' }).expect(201);
    expect(find(await getList(), 'tej')).toHaveLength(2);
  });

  it('nem létező recept → 404', async () => {
    await request(ctx.app).post('/api/shopping-list/from-recipe/9999').expect(404);
  });
});

describe('bevásárlólista – kézi kezelés', () => {
  it('felvétel, összevonás kézi tételnél, mértékegység-alias egységesítése', async () => {
    const a = await request(ctx.app).post('/api/shopping-list').send({ name: 'Kenyér', quantity: 1, unit: 'darab' }).expect(201);
    expect(a.body).toMatchObject({ merged: false, item: { name: 'Kenyér', quantity: 1, unit: 'db' } });
    const b = await request(ctx.app).post('/api/shopping-list').send({ name: ' kenyér ', quantity: 2, unit: 'db' }).expect(200);
    expect(b.body.merged).toBe(true);
    expect(b.body.item.quantity).toBe(3);
  });

  it('szerkesztés: név, mennyiség, mértékegység, kipipálás', async () => {
    const { body } = await request(ctx.app).post('/api/shopping-list').send({ name: 'Alma', quantity: 1, unit: 'kg' }).expect(201);
    const res = await request(ctx.app)
      .patch(`/api/shopping-list/${body.item.id}`)
      .send({ name: 'Zöldalma', quantity: 1.5, unit: 'kg', isChecked: true })
      .expect(200);
    expect(res.body).toMatchObject({ name: 'Zöldalma', quantity: 1.5, unit: 'kg', isChecked: true });
  });

  it('törlés, kipipáltak törlése, teljes kiürítés', async () => {
    const ids: number[] = [];
    for (const name of ['A tétel', 'B tétel', 'C tétel', 'D tétel']) {
      ids.push((await request(ctx.app).post('/api/shopping-list').send({ name }).expect(201)).body.item.id);
    }
    await request(ctx.app).delete(`/api/shopping-list/${ids[0]}`).expect(204);
    await request(ctx.app).delete(`/api/shopping-list/${ids[0]}`).expect(404);
    await request(ctx.app).patch(`/api/shopping-list/${ids[1]}`).send({ isChecked: true }).expect(200);
    const checked = await request(ctx.app).delete('/api/shopping-list/checked').expect(200);
    expect(checked.body.deleted).toBe(1);
    expect((await getList()).map((i) => i.name)).toEqual(['C tétel', 'D tétel']);
    const cleared = await request(ctx.app).delete('/api/shopping-list').expect(200);
    expect(cleared.body.deleted).toBe(2);
    expect(await getList()).toEqual([]);
  });

  it('érvénytelen bemenet → 400', async () => {
    await request(ctx.app).post('/api/shopping-list').send({ name: '' }).expect(400);
    await request(ctx.app).post('/api/shopping-list').send({ name: 'Liszt', quantity: 0 }).expect(400);
    await request(ctx.app).post('/api/shopping-list').send({ name: 'Liszt', quantity: 'sok' }).expect(400);
    const { body } = await request(ctx.app).post('/api/shopping-list').send({ name: 'Liszt' }).expect(201);
    await request(ctx.app).patch(`/api/shopping-list/${body.item.id}`).send({}).expect(400);
    await request(ctx.app).patch(`/api/shopping-list/${body.item.id}`).send({ isChecked: 'igen' }).expect(400);
  });
});
