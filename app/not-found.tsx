import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-7 text-center shadow-card">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
          404 · Out of scope
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
          This page is not in the dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          The address may be incorrect, or the page may have moved. Start from the
          overview to explore Bangladesh&apos;s economic data.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
