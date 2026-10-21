"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { MetricDelta } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { useUiCopy } from "@/components/language-provider";

export function DeltaChip({
  delta,
  className,
}: {
  delta: MetricDelta;
  className?: string;
}) {
  const copy = useUiCopy();
  const Icon =
    delta.direction === "up"
      ? ArrowUpRight
      : delta.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-medium tabular text-muted",
        className,
      )}
      aria-label={`${delta.amountLabel} ${copy.vs} ${delta.previousYear}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{delta.amountLabel}</span>
      <span className="font-normal text-subtle">
        {copy.vs} {delta.previousYear}
      </span>
    </span>
  );
}
