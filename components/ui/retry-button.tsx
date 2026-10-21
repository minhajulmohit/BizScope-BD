"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUiCopy } from "@/components/language-provider";

export function RetryButton({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  const copy = useUiCopy();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className,
      )}
    >
      <RotateCw
        className={cn("h-3.5 w-3.5", isPending && "animate-spin")}
        aria-hidden="true"
      />
      {isPending ? copy.refreshing : (label ?? copy.retry)}
    </button>
  );
}
