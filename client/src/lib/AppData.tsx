import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Stats } from '../../../shared/types';
import { api } from './api';

interface AppDataApi {
  stats: Stats | null;
  refreshStats: () => void;
}

const AppDataContext = createContext<AppDataApi>({ stats: null, refreshStats: () => {} });

/**
 * Globális összesítő adatok (receptszám, kedvencek, bevásárlólista-tételek),
 * amelyeket a fejléc jelvényei és a főoldal használnak. Módosítás után a
 * komponensek `refreshStats()`-szal frissítik.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats | null>(null);

  const refreshStats = useCallback(() => {
    api.stats().then(setStats).catch(() => {
      /* a fejléc jelvényei nem kritikusak – hiba esetén egyszerűen nem jelennek meg */
    });
  }, []);

  useEffect(refreshStats, [refreshStats]);

  return <AppDataContext.Provider value={{ stats, refreshStats }}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => useContext(AppDataContext);
