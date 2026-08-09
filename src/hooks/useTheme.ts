import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";
const KEY = "neon-theme";

function apply(mode: ThemeMode) {
  document.documentElement.classList.toggle("light", mode === "light");
}

/** Dark (default) / Light mode switch persisted per device. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as ThemeMode | null) ?? "dark";
    setMode(stored);
    apply(stored);
  }, []);

  function setTheme(next: ThemeMode) {
    setMode(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  return { mode, setTheme, toggle: () => setTheme(mode === "dark" ? "light" : "dark") };
}
