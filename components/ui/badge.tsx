import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "brand"
  | "blue"
  | "amber"
  | "danger"
  | "neutral"
  | "outline";

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: "border-transparent bg-brand-soft text-brand-strong",
  blue: "border-transparent bg-blue-soft text-blue",
  amber: "border-transparent bg-amber-soft text-amber",
  danger: "border-transparent bg-danger-soft text-danger",
  neutral: "border-transparent bg-surface-muted text-muted",
  outline: "border-line bg-transparent text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-4 tracking-[0.06em]",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
