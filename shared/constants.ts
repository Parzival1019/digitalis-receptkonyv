import type { Difficulty } from './types';

export const DIFFICULTIES: readonly Difficulty[] = ['konnyu', 'kozepes', 'nehez'] as const;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  konnyu: 'Könnyű',
  kozepes: 'Közepes',
  nehez: 'Nehéz',
};

/** Gyakori mértékegységek – a recept- és bevásárlólista-űrlapok javaslataihoz. */
export const COMMON_UNITS = [
  'g', 'dkg', 'kg', 'ml', 'dl', 'l', 'db', 'ek', 'tk', 'csipet',
  'gerezd', 'fej', 'csomag', 'szál', 'szelet', 'bögre', 'marék', 'csokor',
] as const;

/** Elkészítési idő szűrők (perc). */
export const TIME_FILTERS = [15, 30, 60, 120] as const;
