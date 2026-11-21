import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { setup } from './helpers';

let ctx: ReturnType<typeof setup>;
beforeEach(() => {
  ctx = setup();
});

describe('kedvencek', () => {
  it('kedvencnek jelölés, listázás, eltávolítás', async () => {
    await request(ctx.app).put('/api/favorites/1').expect(200, { recipeId: 1, isFavorite: true });
    await request(ctx.app).put('/api/favorites/3').expect(200);

    const list = await request(ctx.app).get('/api/favorites').expect(200);
    expect(list.body.map((r: { id: number }) => r.id).sort()).toEqual([1, 3]);
    expect(list.body.every((r: { isFavorite: boolean }) => r.isFavorite)).toBe(true);

    const detail = await request(ctx.app).get('/api/recipes/1').expect(200);
    expect(detail.body.isFavorite).toBe(true);

    await request(ctx.app).delete('/api/favorites/1').expect(200, { recipeId: 1, isFavorite: false });
    const after = await request(ctx.app).get('/api/favorites').expect(200);
    expect(after.body.map((r: { id: number }) => r.id)).toEqual([3]);
  });

  it('a jelölés idempotens (kétszeri hívás sem duplikál)', async () => {
    await request(ctx.app).put('/api/favorites/2').expect(200);
    await request(ctx.app).put('/api/favorites/2').expect(200);
    const stats = await request(ctx.app).get('/api/stats').expect(200);
    expect(stats.body.favoriteCount).toBe(1);
  });

  it('nem létező recept → 404', async () => {
    await request(ctx.app).put('/api/favorites/9999').expect(404);
  });

  it('kedvencek szerinti szűrés a receptlistán', async () => {
    await request(ctx.app).put('/api/favorites/5').expect(200);
    const res = await request(ctx.app).get('/api/recipes?favorites=true').expect(200);
    expect(res.body.map((r: { id: number }) => r.id)).toEqual([5]);
  });
});
