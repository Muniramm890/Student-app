// FILE: student-app/src/hooks/useDebounce.ts

import { useEffect, useState } from "react";

// Debounces a fast-changing value (typing in a search box, a slider, etc.)
// so dependent effects (API calls) don't fire on every keystroke.
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
