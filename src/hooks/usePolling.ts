import { useEffect, useRef } from "react";

// fn ko har `ms` par chalata hai, sirf jab tab/app visible ho. Wapas visible hote hi turant ek baar chalata hai.
export function usePolling(fn: () => void, ms: number, enabled = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const tick = () => { if (!document.hidden) ref.current?.(); };
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [ms, enabled]);
}
