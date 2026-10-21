import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-muted text-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-[12px] leading-5 text-muted">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
  className,
  compact = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-card border border-danger/25 bg-danger-soft/60",
        compact ? "px-4 py-3" : "p-5",
        className,
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-danger"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-[12px] leading-5 text-muted">{description}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
