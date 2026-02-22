import { DependencyList, useCallback, useEffect, useState } from 'react';

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    let result: T | null = null;
    setLoading(true);
    try {
      result = await fetcher();
      setData(result);
      setError(null);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }

    return result;
  }, deps);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (!active) {
          return;
        }

        setData(result);
        setError(null);
      } catch {
        if (active) {
          setError('Failed to load data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, deps);

  return {
    data,
    loading,
    error,
    refresh,
    setError
  };
}
