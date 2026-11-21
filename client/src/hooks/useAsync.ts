import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

/**
 * Egyszerű adatbetöltő hook: betöltés / hiba / adat állapotokkal és újratöltéssel.
 * Ha a függőségek gyorsan változnak (pl. gépelés közbeni keresés), csak a
 * legutolsó kérés eredménye kerül az állapotba.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true });
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFn = useCallback(fn, deps);

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const data = await memoFn();
      if (id === requestId.current) setState({ data, error: undefined, loading: false });
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, [memoFn]);

  useEffect(() => {
    void run();
  }, [run]);

  const setData = useCallback((updater: (prev: T | undefined) => T | undefined) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return { ...state, reload: run, setData };
}

/** Érték késleltetése (pl. keresőmező gépelése közben). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
