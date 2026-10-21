import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { MetricDelta } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

export function DeltaChip({
  delta,
  className,
}: {
  delta: MetricDelta;
  className?: string;
}) {
  const Icon =
    delta.direction === "up"
      ? ArrowUpRight
      : delta.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tabular text-muted",
        className,
      )}
      aria-label={`${delta.amountLabel} versus ${delta.previousYear}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{delta.amountLabel}</span>
      <span className="font-normal text-subtle">vs {delta.previousYear}</span>
    </span>
  );
}
