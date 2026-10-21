import type { LucideIcon } from "lucide-react";
import { CalendarDays } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { formatUtcDate } from "@/lib/utils/format";
import { SourceLink } from "@/components/ui/source-link";

const COPY = {
  en: {
    unavailable: "Unavailable",
    updated: "Updated",
    updateTimeUnavailable: "Update time unavailable",
    defaultUnavailable: "Not available from the source",
  },
  bn: {
    unavailable: "পাওয়া যাচ্ছে না",
    updated: "হালনাগাদ",
    updateTimeUnavailable: "হালনাগাদের সময় পাওয়া যাচ্ছে না",
    defaultUnavailable: "উৎস থেকে পাওয়া যায়নি",
  },
};

type KpiTone = "brand" | "blue" | "amber" | "neutral";

const ICON_TONES: Record<KpiTone, string> = {
  brand: "bg-brand-soft text-brand",
  blue: "bg-blue-soft text-blue",
  amber: "bg-amber-soft text-amber",
  neutral: "bg-surface-muted text-muted",
};

export interface KpiCardProps {
  label: string;
  value: string | null;
  exactValue?: string;
  unit: string;
  period: string;
  sourceName: string;
  sourceUrl: string;
  providerUpdatedAt: string | null;
  icon: LucideIcon;
  tone?: KpiTone;
  unavailableMessage?: string;
  language: Language;
}

export function KpiCard({
  label,
  value,
  exactValue,
  unit,
  period,
  sourceName,
  sourceUrl,
  providerUpdatedAt,
  icon: Icon,
  tone = "brand",
  unavailableMessage,
  language,
}: KpiCardProps) {
  const copy = COPY[language];
  const isAvailable = value !== null;

  return (
    <article className="group flex min-w-0 flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-[10px]",
            ICON_TONES[tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>

      <h3 className="mt-4 text-[14px] font-medium leading-5 text-muted">
        {label}
      </h3>

      {isAvailable ? (
        <p
          className="mt-1 truncate text-[2rem] font-semibold leading-[1.15] tracking-[-0.045em] text-foreground tabular"
          title={exactValue}
        >
          {value}
        </p>
      ) : (
        <p className="mt-1 text-[1.45rem] font-semibold leading-[1.3] tracking-[-0.03em] text-subtle">
          {copy.unavailable}
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-muted">
        <span>{unit}</span>
        <span className="text-line-strong" aria-hidden="true">
          ·
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {period}
        </span>
      </div>

      {!isAvailable ? (
        <p className="mt-2 text-[13px] leading-5 text-danger">
          {unavailableMessage ?? copy.defaultUnavailable}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3.5 text-[13px] leading-5">
        <SourceLink href={sourceUrl} className="text-foreground-soft">
          {sourceName}
        </SourceLink>
        {providerUpdatedAt ? (
          <span className="text-subtle">
            {copy.updated} {formatUtcDate(providerUpdatedAt)}
          </span>
        ) : (
          <span className="text-subtle">{copy.updateTimeUnavailable}</span>
        )}
      </div>
    </article>
  );
}
