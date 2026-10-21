import type { ReactNode } from "react";
import { CalendarClock, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type NoticeTone = "info" | "warning" | "freshness";

const TONES: Record<
  NoticeTone,
  { wrapper: string; icon: typeof Info; iconClass: string }
> = {
  info: {
    wrapper: "border-blue/20 bg-blue-soft/60",
    icon: Info,
    iconClass: "text-blue",
  },
  warning: {
    wrapper: "border-amber/25 bg-amber-soft/60",
    icon: TriangleAlert,
    iconClass: "text-amber",
  },
  freshness: {
    wrapper: "border-line bg-surface-muted/70",
    icon: CalendarClock,
    iconClass: "text-brand",
  },
};

export function DataNotice({
  title,
  children,
  tone = "freshness",
  className,
}: {
  title: string;
  children?: ReactNode;
  tone?: NoticeTone;
  className?: string;
}) {
  const config = TONES[tone];
  const Icon = config.icon;

  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3",
        config.wrapper,
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClass)}
        aria-hidden="true"
      />
      <div className="min-w-0 text-[14px] leading-6 text-foreground-soft">
        <p className="font-semibold text-foreground">{title}</p>
        {children ? <div className="mt-1 text-muted">{children}</div> : null}
      </div>
    </div>
  );
}
