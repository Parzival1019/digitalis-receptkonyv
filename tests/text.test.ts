import { describe, expect, it } from 'vitest';
import { formatQuantity, normalizeKey, normalizeUnit, roundQuantity, scaleQuantity, toSearchText } from '../shared/text';

describe('szövegnormalizálás', () => {
  it('normalizeKey: kisbetű, szóközök egységesítése, ékezet megtartása', () => {
    expect(normalizeKey('  Darált   Marhahús ')).toBe('darált marhahús');
  });

  it('toSearchText: ékezetek nélküli keresőszöveg', () => {
    expect(toSearchText('Gulyásleves')).toBe('gulyasleves');
    expect(toSearchText('ŐSZIBARACK Ünnepi')).toBe('oszibarack unnepi');
  });

  it('normalizeUnit: aliasok egységesítése, átváltás nélkül', () => {
    expect(normalizeUnit('gramm')).toBe('g');
    expect(normalizeUnit(' Darab ')).toBe('db');
    expect(normalizeUnit('evőkanál')).toBe('ek');
    expect(normalizeUnit('kg')).toBe('kg'); // nem váltja át grammra
    expect(normalizeUnit(undefined)).toBe('');
  });
});

describe('mennyiségek', () => {
  it('lebegőpontos hibák kerekítése', () => {
    expect(roundQuantity(0.1 + 0.2)).toBe(0.3);
  });

  it('adagszám szerinti átszámítás', () => {
    expect(scaleQuantity(400, 4, 2)).toBe(200);
    expect(scaleQuantity(1, 3, 4)).toBe(1.33);
    expect(scaleQuantity(null, 4, 8)).toBeNull();
  });

  it('magyar formátumú megjelenítés', () => {
    expect(formatQuantity(1.5)).toBe('1,5');
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(null)).toBe('');
  });
});
