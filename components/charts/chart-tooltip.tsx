"use client";

import type { TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils/cn";
import { useUiCopy } from "@/components/language-provider";

type ValueFormatter = (value: number, name: string) => string;

export type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipContentProps<number, string>["payload"];
  label?: string | number;
  formatValue?: ValueFormatter;
  formatLabel?: (label: string | number | undefined) => string;
  className?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
  className,
}: ChartTooltipProps) {
  const copy = useUiCopy();

  if (!active || !payload || payload.length === 0) return null;

  const rows = payload.filter(
    (entry) =>
      typeof entry.value === "number" && Number.isFinite(entry.value),
  );

  if (rows.length === 0) return null;

  return (
    <div
      role="tooltip"
      className={cn(
        "min-w-[170px] max-w-[260px] rounded-lg border border-line bg-surface p-3 text-[12px] shadow-lg",
        className,
      )}
    >
      <p className="mb-2 border-b border-line pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
        {formatLabel
          ? formatLabel(label)
          : label !== undefined
            ? String(label)
            : copy.chartObservation}
      </p>
      <ul className="space-y-1.5">
        {rows.map((entry) => {
          const name =
            typeof entry.name === "string" ? entry.name : String(entry.dataKey ?? "");
          const value = entry.value as number;
          const color =
            typeof entry.color === "string"
              ? entry.color
              : typeof entry.stroke === "string"
                ? entry.stroke
                : "var(--chart-emerald)";
          const swatch =
            typeof entry.fill === "string" ? entry.fill : color;

          return (
            <li
              key={`${name}-${String(entry.dataKey ?? "")}`}
              className="flex items-start justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-muted">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: swatch }}
                  aria-hidden="true"
                />
                <span className="truncate">{name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular text-foreground">
                {formatValue ? formatValue(value, name) : String(value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const chartTooltipWrapperStyle = {
  zIndex: 30,
  outline: "none",
} as const;
