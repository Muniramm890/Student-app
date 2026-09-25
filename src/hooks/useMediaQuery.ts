// FILE: student-app/src/hooks/useMediaQuery.ts

import { useEffect, useState } from "react";

// Generic media-query hook for the rare cases CSS classes aren't enough
// (e.g. choosing a different Cashfree redirectTarget on mobile vs desktop).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Convenience presets used across the app.
export const useIsDesktop = () => useMediaQuery("(min-width: 900px)");
export const useIsMobile = () => useMediaQuery("(max-width: 899px)");
