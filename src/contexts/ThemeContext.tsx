// FILE: student-app/src/contexts/ThemeContext.tsx

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Mode = "light" | "dark";
type ThemeCtx = { mode: Mode; toggle: () => void; setMode: (m: Mode) => void };

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "student_theme_mode";

const getInitialMode = (): Mode => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<Mode>(getInitialMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      mode === "dark" ? "#0B0D14" : "#F7F7FB"
    );
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<ThemeCtx>(
    () => ({
      mode,
      setMode: setModeState,
      toggle: () => setModeState((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
