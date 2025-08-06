import {
  useRef,
  useEffect,
  type DependencyList,
  type EffectCallback,
} from "react";

export const useDebouncedEffect = (
  callback: EffectCallback,
  deps: DependencyList,
  limit: number,
) => {
  const lastCallRef = useRef(0);
  const throttledCallback = useEffect(() => {
    const now = Date.now();
    if (now - lastCallRef.current >= limit) {
      lastCallRef.current = now;

      callback();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps || []), limit]);

  return throttledCallback;
};
