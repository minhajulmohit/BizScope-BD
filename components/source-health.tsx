"use client";

import {
  BookOpenText,
  Database,
  Landmark,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import type { ProviderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatUtcDateTime } from "@/lib/utils/format";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSourceStatus } from "@/components/use-source-status";
import { useLanguage } from "@/components/language-provider";

const PROVIDER_ICONS = {
  "world-bank": Landmark,
  "exchange-rates": RefreshCw,
  opendatabd: Database,
} as const;

const HEALTH_CONFIG = {
  operational: {
    dot: "bg-brand",
    text: "text-brand-strong",
    badge: "bg-brand-soft",
  },
  degraded: {
    dot: "bg-amber",
    text: "text-amber",
    badge: "bg-amber-soft",
  },
  unavailable: {
    dot: "bg-danger",
    text: "text-danger",
    badge: "bg-danger-soft",
  },
} as const;

const COPY = {
  en: {
    checking: "Checking source status",
    errorTitle: "Source status could not be loaded",
    errorBody:
      "The dashboard data functions may still be available. Try the status check again.",
    retry: "Retry status",
    checked: (date: string, responding: number, total: number) =>
      `Checked ${date} · ${responding} of ${total} sources responding`,
    recheck: "Recheck",
    lastChecked: (date: string) => `Last checked: ${date}`,
    status: {
      operational: "Working",
      degraded: "Limited",
      unavailable: "Unavailable",
    },
  },
  bn: {
    checking: "উৎসের অবস্থা যাচাই হচ্ছে",
    errorTitle: "উৎসের অবস্থা লোড করা যায়নি",
    errorBody:
      "ড্যাশবোর্ডের ডেটা ফাংশন এখনো পাওয়া যেতে পারে। অবস্থা-যাচাই আবার চেষ্টা করুন।",
    retry: "অবস্থা আবার যাচাই",
    checked: (date: string, responding: number, total: number) =>
      `${date} যাচাই · ${total}টির মধ্যে ${responding}টি উৎস সাড়া দিচ্ছে`,
    recheck: "আবার যাচাই",
    lastChecked: (date: string) => `সর্বশেষ যাচাই: ${date}`,
    status: {
      operational: "চালু",
      degraded: "সীমিত",
      unavailable: "অনুপলব্ধ",
    },
  },
} as const;

const PROVIDER_BN: Record<
  ProviderStatus["id"],
  {
    name: string;
    cadenceLabel: string;
    detail: (provider: ProviderStatus) => string;
  }
> = {
  "world-bank": {
    name: "World Bank WDI",
    cadenceLabel: "বার্ষিক · সময়ে সময়ে সংশোধিত",
    detail: (provider) => {
      if (provider.status === "unavailable") {
        return "বিশ্বব্যাংকের ডেটায় পৌঁছানো যায়নি।";
      }
      const available = provider.detailData?.available;
      const total = provider.detailData?.total;
      return available !== undefined && total !== undefined
        ? `${total}টির মধ্যে ${available}টি সূচক পাওয়া যাচ্ছে`
        : "বিশ্বব্যাংকের সূচক পাওয়া যাচ্ছে।";
    },
  },
  "exchange-rates": {
    name: "ExchangeRate-API",
    cadenceLabel: "দৈনিক রেফারেন্স · তৃতীয় পক্ষ",
    detail: (provider) =>
      provider.status === "unavailable"
        ? "দৈনিক মুদ্রা রেফারেন্সে পৌঁছানো যায়নি।"
        : "ডলার–টাকার দৈনিক রেফারেন্স হার পাওয়া যাচ্ছে।",
  },
  opendatabd: {
    name: "OpenDataBD",
    cadenceLabel: "ক্যাটালগ · চাহিদামতো",
    detail: (provider) => {
      if (provider.status === "unavailable") {
        return "সর্বজনীন ক্যাটালগে পৌঁছানো যায়নি।";
      }
      const datasets = provider.detailData?.datasets;
      return datasets !== undefined
        ? `${datasets}টি ক্যাটালগ ডেটাসেট পাওয়া যাচ্ছে।`
        : "সর্বজনীন ডেটাসেট ক্যাটালগ পাওয়া যাচ্ছে।";
    },
  },
};

export function SourceHealth() {
  const language = useLanguage();
  const copy = COPY[language];
  const { data, loading, error, retry } = useSourceStatus();

  if (loading) {
    return (
      <div className="space-y-3 p-5 sm:p-6" aria-label={copy.checking}>
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
            {copy.errorTitle}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            {copy.errorBody}
          </p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-6">
        <p className="text-[11px] text-muted" aria-live="polite">
          {copy.checked(
            formatUtcDateTime(data.generatedAt),
            data.providers.filter(
              (provider) => provider.status === "operational",
            ).length,
            data.providers.length,
          )}
        </p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1 rounded-md text-[11px] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <RotateCw className="h-3 w-3" aria-hidden="true" />
          {copy.recheck}
        </button>
      </div>

      <ul className="divide-y divide-line">
        {data.providers.map((provider) => {
          const Icon =
            PROVIDER_ICONS[provider.id as keyof typeof PROVIDER_ICONS] ??
            BookOpenText;
          const health = HEALTH_CONFIG[provider.status];
          const providerBn = PROVIDER_BN[provider.id];
          const providerName =
            language === "bn" ? providerBn.name : provider.name;
          const cadenceLabel =
            language === "bn" ? providerBn.cadenceLabel : provider.cadenceLabel;
          const detail =
            language === "bn" ? providerBn.detail(provider) : provider.detail;

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
                      {providerName}
                    </p>
                    <CadenceBadge
                      cadence={provider.cadence}
                      label={cadenceLabel}
                    />
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {detail}
                  </p>
                  <p className="mt-0.5 text-[10px] text-subtle">
                    {copy.lastChecked(
                      formatUtcDateTime(provider.lastRetrievedAt),
                    )}
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
                {copy.status[provider.status]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
