"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useSourceStatus } from "@/components/use-source-status";

const DOT_TONES: Record<string, string> = {
  operational: "bg-brand",
  degraded: "bg-amber",
  unavailable: "bg-danger",
  checking: "bg-subtle",
};

export function SourceStatusPill() {
  const { data, loading, error } = useSourceStatus();

  const health = loading ? "checking" : error || !data ? "unavailable" : data.overall;

  const label = loading
    ? "Checking sources"
    : error || !data
      ? "Status unavailable"
      : data.overall === "operational"
        ? `${data.providers.length}/${data.providers.length} sources responding`
        : data.overall === "degraded"
          ? "Sources degraded"
          : "Sources unavailable";

  return (
    <Link
      href="/sources"
      title="View source health and methodology"
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[11px] font-medium text-muted transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      <span className="sm:hidden">Sources</span>
    </Link>
  );
}
