import { cn } from "@/lib/utils/cn";

export interface LegendItem {
  label: string;
  color: string;
  shape?: "line" | "bar";
}

export function ChartLegend({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
      aria-label="Chart legend"
    >
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted"
        >
          <span
            className={cn(
              "shrink-0",
              item.shape === "line"
                ? "h-[2px] w-4 rounded-full"
                : "h-2.5 w-2.5 rounded-[2px]",
            )}
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
