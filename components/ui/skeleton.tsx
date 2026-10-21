import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-9 w-9 rounded-[10px]" />
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
      <Skeleton className="mt-5 h-3 w-28" />
      <Skeleton className="mt-3 h-8 w-40" />
      <Skeleton className="mt-3 h-3 w-48" />
      <Skeleton className="mt-6 h-3 w-full" />
    </div>
  );
}
