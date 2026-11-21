import { formatQuantity } from '../../../shared/text';

/** Elkészítési idő olvasható formában: 90 → „1 ó 30 p”. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} perc`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ó ${m} p` : `${h} óra`;
}

/** Mennyiség + mértékegység: „250 g”, „1,5 l”, vagy „ízlés szerint”. */
export function formatAmount(quantity: number | null, unit: string): string {
  if (quantity === null) return unit ? unit : 'ízlés szerint';
  return [formatQuantity(quantity), unit].filter(Boolean).join(' ');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}
