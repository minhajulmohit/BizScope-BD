"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  LANGUAGE_COOKIE,
  type Language,
} from "@/lib/i18n";
import { useLanguage, useUiCopy } from "@/components/language-provider";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageToggle({ className }: { className?: string }) {
  const language = useLanguage();
  const copy = useUiCopy();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextLanguage: Language = language === "en" ? "bn" : "en";

  function switchLanguage() {
    document.documentElement.lang = nextLanguage;
    document.cookie = `${LANGUAGE_COOKIE}=${nextLanguage}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={isPending}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 text-[10px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-foreground disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-2.5 sm:text-[11px]",
        className,
      )}
      aria-label={copy.languageSwitchAria}
      title={copy.languageSwitchAria}
      aria-live="polite"
    >
      <Languages
        className={cn("h-[15px] w-[15px] shrink-0", isPending && "animate-pulse")}
        aria-hidden="true"
      />
      <span className="sm:hidden">{copy.languageShortLabel}</span>
      <span className="hidden sm:inline">{copy.languageSwitchLabel}</span>
    </button>
  );
}
