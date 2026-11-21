import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { RecipeSummary } from '../shared/types';
import { setup } from './helpers';

let ctx: ReturnType<typeof setup>;
beforeAll(() => {
  ctx = setup();
});

async function search(qs: string): Promise<RecipeSummary[]> {
  const res = await request(ctx.app).get(`/api/recipes?${qs}`).expect(200);
  return res.body;
}
const titles = (list: RecipeSummary[]) => list.map((r) => r.title);

describe('keresés és szűrés', () => {
  it('receptnév alapján, kis-/nagybetűtől és ékezettől függetlenül', async () => {
    expect(titles(await search('q=gulyas'))).toEqual(['Gulyásleves']);
    expect(titles(await search(`q=${encodeURIComponent('CARBONARA')}`))).toEqual(['Carbonara']);
  });

  it('hozzávaló alapján', async () => {
    const result = await search(`ingredient=${encodeURIComponent('darált marhahús')}`);
    expect(titles(result).sort()).toEqual(['Bolognai spagetti', 'Lasagne']);
  });

  it('több hozzávaló: mindegyiknek szerepelnie kell', async () => {
    const result = await search(`ingredient=${encodeURIComponent('tojás, kolbász')}`);
    expect(titles(result).sort()).toEqual(['Lecsó', 'Rakott krumpli']);
  });

  it('kategória szerinti szűrés', async () => {
    const result = await search('category=levesek');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.category.slug === 'levesek')).toBe(true);
  });

  it('elkészítési idő szerinti szűrés', async () => {
    const result = await search('maxTime=15');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.prepTimeMinutes <= 15)).toBe(true);
  });

  it('nehézség szerinti szűrés', async () => {
    const result = await search('difficulty=nehez');
    expect(titles(result).sort()).toEqual(['Lasagne', 'Somlói galuska', 'Töltött káposzta']);
  });

  it('feltételek együttes alkalmazása', async () => {
    const result = await search(`category=tesztak&maxTime=30&difficulty=konnyu&ingredient=${encodeURIComponent('túró')}`);
    expect(titles(result)).toEqual(['Túrós csusza']);
  });

  it('rendezés elkészítési idő szerint (növekvő és csökkenő)', async () => {
    const asc = (await search('sort=time')).map((r) => r.prepTimeMinutes);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = (await search('sort=time&order=desc')).map((r) => r.prepTimeMinutes);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it('rendezés név szerint', async () => {
    const asc = titles(await search('sort=name'));
    expect(asc[0]).toBe('Avokádós pirítós buggyantott tojással');
    const desc = titles(await search('sort=name&order=desc'));
    expect(desc).toEqual([...asc].reverse());
  });

  it('üres találati lista, és a LIKE-helyettesítő karakterek nem okoznak hibát', async () => {
    expect(await search('q=nincsilyenrecept')).toEqual([]);
    expect(await search(`q=${encodeURIComponent('%_')}`)).toEqual([]);
  });

  it('kiemelt receptek limittel', async () => {
    const result = await search('featured=true&limit=3');
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.isFeatured)).toBe(true);
  });
});
