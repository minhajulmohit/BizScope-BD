"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useLanguage, useUiCopy } from "@/components/language-provider";
import { useSourceStatus } from "@/components/use-source-status";

const DOT_TONES: Record<string, string> = {
  operational: "bg-brand",
  degraded: "bg-amber",
  unavailable: "bg-danger",
  checking: "bg-subtle",
};

const COPY = {
  en: {
    checking: "Checking sources",
    unavailable: "Status unavailable",
    responding: (count: number, total: number) =>
      count === total ? "All sources online" : `${count}/${total} sources responding`,
    degraded: "Sources degraded",
    offline: "Sources unavailable",
    title: "View source health and methodology",
  },
  bn: {
    checking: "উৎস যাচাই হচ্ছে",
    unavailable: "স্ট্যাটাস পাওয়া যাচ্ছে না",
    responding: (count: number, total: number) =>
      count === total ? "সব উৎস চালু" : `${total}টির মধ্যে ${count}টি উৎস সাড়া দিচ্ছে`,
    degraded: "উৎসগুলো সীমিতভাবে কাজ করছে",
    offline: "উৎসগুলো অনুপলব্ধ",
    title: "উৎসের অবস্থা ও পদ্ধতি দেখুন",
  },
};

export function SourceStatusPill() {
  const language = useLanguage();
  const ui = useUiCopy();
  const copy = COPY[language];
  const { data, loading, error } = useSourceStatus();

  const health = loading ? "checking" : error || !data ? "unavailable" : data.overall;

  const label = loading
    ? copy.checking
    : error || !data
      ? copy.unavailable
      : data.overall === "operational"
        ? copy.responding(data.providers.length, data.providers.length)
        : data.overall === "degraded"
          ? copy.degraded
          : copy.offline;

  return (
    <Link
      href="/sources"
      title={copy.title}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            DOT_TONES[health] ?? DOT_TONES.unavailable,
            loading && "animate-pulse",
          )}
          aria-hidden="true"
        />
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{ui.source}</span>
    </Link>
  );
}
