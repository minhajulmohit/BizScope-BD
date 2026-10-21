"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUiCopy } from "@/components/language-provider";

export function SourceLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const copy = useUiCopy();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-sm underline decoration-line-strong underline-offset-2 transition-colors hover:text-foreground hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className,
      )}
    >
      <span>{children}</span>
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="sr-only">{copy.opensInNewTab}</span>
    </a>
  );
}
