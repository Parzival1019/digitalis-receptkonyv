import { CakeSlice, CookingPot, Drumstick, EggFried, Salad, Soup, Utensils, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  soup: Soup,
  drumstick: Drumstick,
  'cooking-pot': CookingPot,
  salad: Salad,
  'cake-slice': CakeSlice,
  'egg-fried': EggFried,
  utensils: Utensils,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Utensils;
  return <Icon className={className} aria-hidden="true" />;
}

/** Kategóriánkénti finom színátmenet a kép nélküli receptekhez. */
export const CATEGORY_TONES: Record<string, string> = {
  levesek: 'from-amber-100 via-orange-50 to-cream-100 text-amber-700',
  foetelek: 'from-rose-100 via-orange-50 to-cream-100 text-rose-700',
  tesztak: 'from-yellow-100 via-amber-50 to-cream-100 text-yellow-700',
  salatak: 'from-sage-200 via-sage-50 to-cream-100 text-sage-700',
  desszertek: 'from-pink-100 via-rose-50 to-cream-100 text-pink-700',
  reggelik: 'from-sky-100 via-cream-50 to-cream-100 text-sky-700',
};

export function categoryTone(slug: string): string {
  return CATEGORY_TONES[slug] ?? 'from-sage-100 via-cream-50 to-cream-100 text-sage-700';
}
