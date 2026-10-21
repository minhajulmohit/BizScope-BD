"use client";

import { Moon, Sun } from "lucide-react";
import { useUiCopy } from "@/components/language-provider";

export function ThemeToggle() {
  const copy = useUiCopy();

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
      className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={copy.themeToggle}
      title={copy.themeToggle}
    >
      <Moon className="h-[17px] w-[17px] dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-[17px] w-[17px] dark:block" aria-hidden="true" />
    </button>
  );
}
