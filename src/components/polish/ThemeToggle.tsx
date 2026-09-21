import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { haptic } from "@/lib/haptics";

const KEY = "spai.theme";

/** 16. Theme switch that crossfades every colour instead of hard-cutting. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.add("theme-crossfade");
    root.classList.toggle("dark", dark);
    localStorage.setItem(KEY, dark ? "dark" : "light");
    const id = window.setTimeout(() => root.classList.remove("theme-crossfade"), 700);
    return () => window.clearTimeout(id);
  }, [dark, ready]);

  return (
    <button
      onClick={() => {
        haptic("tap");
        setDark((d) => !d);
      }}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground active:opacity-80"
    >
      <span key={dark ? "d" : "l"} className="fab-swap flex">
        {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}
