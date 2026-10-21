"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextIsDark);

    try {
      window.localStorage.setItem(
        "bizscope-theme",
        nextIsDark ? "dark" : "light",
      );
    } catch {
      // Theme preference persistence is optional; the current page still updates.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="Toggle light and dark theme"
      title="Toggle light and dark theme"
    >
      <Moon className="h-[17px] w-[17px] dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-[17px] w-[17px] dark:block" aria-hidden="true" />
    </button>
  );
}
