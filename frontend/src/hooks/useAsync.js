import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function when deps change and tracks { data, loading, error }.
 * Stale responses (from an older call) are ignored.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null });
  const callId = useRef(0);

  const run = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (id === callId.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (id === callId.current) setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { if (immediate) run(); }, [run, immediate]);

  return { ...state, refetch: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
