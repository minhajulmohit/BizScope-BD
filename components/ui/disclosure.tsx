import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Disclosure({
  summary,
  description,
  children,
  defaultOpen = false,
  className,
  contentClassName,
}: {
  summary: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-card border border-line bg-surface shadow-card",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-card px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-5 text-foreground">
            {summary}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[14px] leading-5 text-muted">
              {description}
            </span>
          ) : null}
        </span>
      </summary>
      <div
        className={cn(
          "border-t border-line",
          contentClassName ?? "p-4 sm:p-5",
        )}
      >
        {children}
      </div>
    </details>
  );
}
