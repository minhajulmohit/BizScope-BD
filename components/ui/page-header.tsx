import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-[2.5rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
          {description}
        </p>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
