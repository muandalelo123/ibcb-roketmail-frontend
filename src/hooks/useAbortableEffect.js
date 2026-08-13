
// src/hooks/useAbortableEffect.js
import { useEffect, useRef } from "react";

/**
 * useAbortableEffect(effect, deps)
 *
 * - Fournit un AbortSignal stable pour l'effet.
 * - Annule automatiquement à l'unmount et à chaque re-run (deps change).
 * - Optionnellement aide à ignorer les setState après abort (via isActive()).
 *
 * Usage:
 * useAbortableEffect(({ signal, isActive }) => {
 *   (async () => {
 *     const data = await apiCall({ signal });
 *     if (!isActive()) return;
 *     setState(data);
 *   })();
 * }, [dep1, dep2]);
 */
export function useAbortableEffect(effect, deps) {
  const runIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRunId = ++runIdRef.current;

    const isActive = () =>
      !controller.signal.aborted && runIdRef.current === currentRunId;

    const cleanup = effect({ signal: controller.signal, isActive });

    return () => {
      controller.abort();
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}


