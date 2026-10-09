"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";
const themeEvent = "noor:theme-change";
const systemQuery = "(prefers-color-scheme: dark)";

function applyTheme(preference: Theme | null) {
  const theme = preference ?? (window.matchMedia(systemQuery).matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference ?? "system";
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#171513" : "#ffffff";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(systemQuery);
  const onSystemChange = () => {
    if (document.documentElement.dataset.themePreference === "system") {
      applyTheme(null);
      onChange();
    }
  };
  const onStorageChange = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyTheme(event.newValue === "light" || event.newValue === "dark" ? event.newValue : null);
      onChange();
    }
  };
  window.addEventListener(themeEvent, onChange);
  window.addEventListener("storage", onStorageChange);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(themeEvent, onChange);
    window.removeEventListener("storage", onStorageChange);
    media.removeEventListener("change", onSystemChange);
  };
}

const getSnapshot = () => document.documentElement.dataset.theme === "dark";
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const theme = getSnapshot() ? "light" : "dark";
    applyTheme(theme);
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {
      // The switch still works for this visit when browser storage is blocked.
    }
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button type="button" className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Dark mode" aria-pressed={isDark} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <Moon className="theme-moon" aria-hidden="true" />
      <Sun className="theme-sun" aria-hidden="true" />
    </button>
  );
}
