import type { LucideIcon } from "lucide-react";
import { CalendarDays } from "lucide-react";
import type { DataCadence, MetricDelta } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatUtcDate } from "@/lib/utils/format";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { DeltaChip } from "@/components/ui/delta-chip";
import { SourceLink } from "@/components/ui/source-link";

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
  cadence: DataCadence;
  cadenceLabel: string;
  providerUpdatedAt: string | null;
  delta?: MetricDelta | null;
  icon: LucideIcon;
  tone?: KpiTone;
  unavailableMessage?: string;
}

export function KpiCard({
  label,
  value,
  exactValue,
  unit,
  period,
  sourceName,
  sourceUrl,
  cadence,
  cadenceLabel,
  providerUpdatedAt,
  delta,
  icon: Icon,
  tone = "brand",
  unavailableMessage = "Not available from the source",
}: KpiCardProps) {
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
        <CadenceBadge cadence={cadence} label={cadenceLabel} />
      </div>

      <h3 className="mt-5 text-[12px] font-medium leading-5 text-muted">
        {label}
      </h3>

      {isAvailable ? (
        <p
          className="mt-1 truncate text-[1.85rem] font-semibold leading-[1.15] tracking-[-0.045em] text-foreground tabular"
          title={exactValue}
        >
          {value}
        </p>
      ) : (
        <p className="mt-1 text-[1.45rem] font-semibold leading-[1.3] tracking-[-0.03em] text-subtle">
          Unavailable
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
        <span>{unit}</span>
        <span className="text-line-strong" aria-hidden="true">
          /
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {period}
        </span>
      </div>

      <div className="mt-2 min-h-5">
        {isAvailable && delta ? <DeltaChip delta={delta} /> : null}
        {!isAvailable ? (
          <p className="text-[11px] leading-5 text-danger">{unavailableMessage}</p>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-subtle">
            Source
          </p>
          <SourceLink
            href={sourceUrl}
            className="mt-0.5 text-[11px] leading-4 text-foreground-soft"
          >
            {sourceName}
          </SourceLink>
        </div>
        <p className="shrink-0 text-right text-[10px] leading-4 text-subtle">
          {providerUpdatedAt ? (
            <>
              <span className="block font-semibold uppercase tracking-[0.09em]">
                Provider update
              </span>
              {formatUtcDate(providerUpdatedAt)}
            </>
          ) : (
            "Update time unavailable"
          )}
        </p>
      </div>
    </article>
  );
}
