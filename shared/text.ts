/**
 * Szövegnormalizáló segédfüggvények.
 *
 * - `normalizeKey`: azonosításhoz (kisbetű, felesleges szóközök nélkül, ékezetekkel).
 *   Ezzel döntjük el, hogy két hozzávaló „ugyanaz”-e (pl. „Liszt ” = „liszt”).
 * - `toSearchText`: kereséshez (kisbetű, ékezetek nélkül), így a „gulyas” keresés
 *   is megtalálja a „Gulyásleves” receptet.
 */

export function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function toSearchText(value: string): string {
  return normalizeKey(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const UNIT_ALIASES: Record<string, string> = {
  gramm: 'g',
  gr: 'g',
  dekagramm: 'dkg',
  deka: 'dkg',
  kilogramm: 'kg',
  kiló: 'kg',
  milliliter: 'ml',
  deciliter: 'dl',
  liter: 'l',
  darab: 'db',
  'db.': 'db',
  evőkanál: 'ek',
  'ek.': 'ek',
  teáskanál: 'tk',
  'tk.': 'tk',
  kávéskanál: 'kk',
};

/**
 * Mértékegység egységesítése (pl. „gramm” → „g”, „Darab” → „db”).
 * Átváltást (g ↔ kg) szándékosan NEM végzünk, így különböző mértékegységű
 * tételek sosem adódnak össze hibásan.
 */
export function normalizeUnit(unit: string | null | undefined): string {
  const key = normalizeKey(unit ?? '');
  return UNIT_ALIASES[key] ?? key;
}

/** Mennyiség kerekítése a lebegőpontos hibák elkerülésére (pl. 0.1 + 0.2). */
export function roundQuantity(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Mennyiség magyaros megjelenítése: 1.5 → „1,5”, 2 → „2”. */
export function formatQuantity(quantity: number | null): string {
  if (quantity === null) return '';
  return roundQuantity(quantity).toLocaleString('hu-HU', { maximumFractionDigits: 2 });
}

/** Hozzávaló mennyiségének átszámítása más adagszámra. */
export function scaleQuantity(
  quantity: number | null,
  fromServings: number,
  toServings: number,
): number | null {
  if (quantity === null) return null;
  if (fromServings <= 0 || toServings <= 0) return quantity;
  return roundQuantity((quantity * toServings) / fromServings);
}
