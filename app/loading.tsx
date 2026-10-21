import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard data">
      <span className="sr-only">Loading dashboard data…</span>
      <div className="border-b border-line pb-7">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-4 h-10 w-[min(100%,420px)]" />
        <Skeleton className="mt-4 h-4 w-[min(100%,560px)]" />
        <Skeleton className="mt-2 h-4 w-[min(100%,420px)]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 shadow-card xl:col-span-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          <Skeleton className="mt-6 h-[270px] w-full" />
        </div>
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-6 h-[270px] w-full" />
        </div>
      </div>
    </div>
  );
}
