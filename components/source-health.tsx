"use client";

import {
  BookOpenText,
  Database,
  Landmark,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatUtcDateTime } from "@/lib/utils/format";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSourceStatus } from "@/components/use-source-status";

const PROVIDER_ICONS = {
  "world-bank": Landmark,
  "exchange-rates": RefreshCw,
  opendatabd: Database,
} as const;

const HEALTH_CONFIG = {
  operational: {
    label: "Operational",
    dot: "bg-brand",
    text: "text-brand-strong",
    badge: "bg-brand-soft",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber",
    text: "text-amber",
    badge: "bg-amber-soft",
  },
  unavailable: {
    label: "Unavailable",
    dot: "bg-danger",
    text: "text-danger",
    badge: "bg-danger-soft",
  },
} as const;

export function SourceHealth() {
  const { data, loading, error, retry } = useSourceStatus();

  if (loading) {
    return (
      <div className="space-y-3 p-5 sm:p-6" aria-label="Checking source status">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-line p-4"
          >
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            Source status could not be loaded
          </p>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            The dashboard data functions may still be available. Try the status
            check again.
          </p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry status
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-6">
        <p className="text-[11px] text-muted" aria-live="polite">
          Checked{" "}
          <span className="font-medium text-foreground-soft">
            {formatUtcDateTime(data.generatedAt)}
          </span>{" "}
          · {data.providers.filter((provider) => provider.status === "operational").length}{" "}
          of {data.providers.length} providers responding
        </p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1 rounded-md text-[11px] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <RotateCw className="h-3 w-3" aria-hidden="true" />
          Recheck
        </button>
      </div>

      <ul className="divide-y divide-line">
        {data.providers.map((provider) => {
          const Icon =
            PROVIDER_ICONS[provider.id as keyof typeof PROVIDER_ICONS] ??
            BookOpenText;
          const health = HEALTH_CONFIG[provider.status];

          return (
            <li
              key={provider.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-foreground">
                      {provider.name}
                    </p>
                    <CadenceBadge
                      cadence={provider.cadence}
                      label={provider.cadenceLabel}
                    />
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {provider.detail}
                  </p>
                  <p className="mt-0.5 text-[10px] text-subtle">
                    Last retrieved: {formatUtcDateTime(provider.lastRetrievedAt)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] sm:self-center",
                  health.badge,
                  health.text,
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", health.dot)}
                  aria-hidden="true"
                />
                {health.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
