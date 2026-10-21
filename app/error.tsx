"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BizScope BD render error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-7 text-center shadow-card">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">
          This page could not be rendered
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          An unexpected application error occurred. The underlying data provider
          may be temporarily unavailable. Try loading the page again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
