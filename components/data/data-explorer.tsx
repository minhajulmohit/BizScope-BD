"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Layers,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import type { DatasetCatalogData, DatasetRecord } from "@/lib/api/types";
import {
  formatInteger,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/ui/source-link";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/language-provider";

const PAGE_LIMIT = 12;

const COPY = {
  en: {
    formatNotListed: "Format not listed",
    noDescription: "No description provided in the public catalog.",
    publisher: "Publisher / source",
    licence: "Licence",
    catalogUpdated: "Catalog updated",
    notSpecified: "Not specified",
    downloads: (count: string) => `${count} downloads`,
    views: (count: string) => `${count} views`,
    catalogRecord: "Catalog record",
    originalSource: "Original source",
    statsAria: "OpenDataBD catalog statistics",
    catalogDatasets: "Catalog datasets",
    contributors: "Contributors",
    recordedDownloads: "Recorded downloads",
    categories: "Categories",
    publicCatalogNote: "Public catalog · metadata only · files may require sign-in",
    retrieved: (date: string) => `Retrieved ${date}`,
    searchCatalog: "Search catalog",
    searchPlaceholder: "Search dataset titles",
    clearSearch: "Clear search",
    category: "Category",
    allCategories: "All categories",
    clear: "Clear",
    resultsEyebrow: "Catalog results",
    loading: "Loading public datasets…",
    datasetCount: (count: string, filtered: boolean) =>
      `${count} ${count === "1" ? "dataset" : "datasets"}${filtered ? " matching your filters" : " in the public catalog"}`,
    noResponse: "No catalog response yet",
    pageInfo: (page: number, total: number) =>
      `Page ${page} of ${total} · ${PAGE_LIMIT} per page`,
    errorTitle: "The dataset catalog could not be loaded",
    errorDescription:
      "OpenDataBD's public catalog may be temporarily unavailable, or the response was incomplete. No placeholder datasets are shown.",
    retryCatalog: "Retry catalog",
    noMatchTitle: "No datasets match these filters",
    emptyTitle: "The catalog is empty",
    noMatchDescription:
      "Try a broader title search or choose a different category. An empty result does not imply that official data on the topic does not exist.",
    emptyDescription:
      "OpenDataBD's public catalog currently returns no published datasets. Check back later or use the official source directory.",
    clearFilters: "Clear filters",
    pagination: "Dataset pagination",
    previous: "Previous",
    next: "Next",
    footerNote:
      "Catalog metadata changes over time; dataset licences and access conditions vary by record.",
    catalogHelp: "Catalog help",
    visitCatalog: "Visit catalog",
    disclaimer:
      "Data Explorer shows catalog metadata only. BizScope BD does not bypass authentication or download restrictions for dataset files.",
  },
  bn: {
    formatNotListed: "ফরম্যাট উল্লেখ নেই",
    noDescription: "সর্বজনীন ক্যাটালগে কোনো বিবরণ দেওয়া নেই।",
    publisher: "প্রকাশক / উৎস",
    licence: "লাইসেন্স",
    catalogUpdated: "ক্যাটালগ হালনাগাদ",
    notSpecified: "উল্লেখ নেই",
    downloads: (count: string) => `${count}টি ডাউনলোড`,
    views: (count: string) => `${count}টি ভিউ`,
    catalogRecord: "ক্যাটালগ রেকর্ড",
    originalSource: "মূল উৎস",
    statsAria: "OpenDataBD ক্যাটালগের পরিসংখ্যান",
    catalogDatasets: "ক্যাটালগে ডেটাসেট",
    contributors: "অবদানকারী",
    recordedDownloads: "রেকর্ড করা ডাউনলোড",
    categories: "বিভাগ",
    publicCatalogNote:
      "সর্বজনীন ক্যাটালগ · কেবল মেটাডেটা · ফাইল খুলতে সাইন-ইন লাগতে পারে",
    retrieved: (date: string) => `সংগৃহীত ${date}`,
    searchCatalog: "ক্যাটালগ খুঁজুন",
    searchPlaceholder: "ডেটাসেটের শিরোনাম খুঁজুন",
    clearSearch: "খোঁজা মুছুন",
    category: "বিভাগ",
    allCategories: "সব বিভাগ",
    clear: "মুছুন",
    resultsEyebrow: "ক্যাটালগের ফলাফল",
    loading: "সর্বজনীন ডেটাসেট লোড হচ্ছে…",
    datasetCount: (count: string, filtered: boolean) =>
      `${count}টি ডেটাসেট${filtered ? " আপনার ফিল্টারের সঙ্গে মিলেছে" : " সর্বজনীন ক্যাটালগে আছে"}`,
    noResponse: "ক্যাটালগ থেকে এখনো কোনো উত্তর আসেনি",
    pageInfo: (page: number, total: number) =>
      `পৃষ্ঠা ${page}/${total} · প্রতি পৃষ্ঠায় ${PAGE_LIMIT}টি`,
    errorTitle: "ডেটাসেট ক্যাটালগ লোড করা যায়নি",
    errorDescription:
      "OpenDataBD-র সর্বজনীন ক্যাটালগ সাময়িকভাবে অনুপলব্ধ থাকতে পারে, অথবা উত্তরটি অসম্পূর্ণ ছিল। কোনো প্লেসহোল্ডার ডেটাসেট দেখানো হচ্ছে না।",
    retryCatalog: "ক্যাটালগ আবার চেষ্টা করুন",
    noMatchTitle: "এই ফিল্টারে কোনো ডেটাসেট মেলেনি",
    emptyTitle: "ক্যাটালগ খালি",
    noMatchDescription:
      "আরও বিস্তৃত শিরোনামে খুঁজুন বা অন্য বিভাগ বাছুন। খালি ফলাফল মানে এই নয় যে বিষয়টির সরকারি ডেটা নেই।",
    emptyDescription:
      "OpenDataBD-র সর্বজনীন ক্যাটালগে এখন কোনো প্রকাশিত ডেটাসেট নেই। পরে আবার দেখুন বা সরকারি উৎসের তালিকা ব্যবহার করুন।",
    clearFilters: "ফিল্টার মুছুন",
    pagination: "ডেটাসেট পেজিনেশন",
    previous: "আগের",
    next: "পরের",
    footerNote:
      "ক্যাটালগের মেটাডেটা সময়ের সঙ্গে বদলায়; ডেটাসেটের লাইসেন্স ও অ্যাক্সেসের শর্ত রেকর্ডভেদে ভিন্ন।",
    catalogHelp: "ক্যাটালগ সহায়তা",
    visitCatalog: "ক্যাটালগে যান",
    disclaimer:
      "ডেটা এক্সপ্লোরার কেবল ক্যাটালগের মেটাডেটা দেখায়। BizScope BD ডেটাসেট ফাইলের জন্য প্রমাণীকরণ বা ডাউনলোডের সীমা এড়িয়ে যায় না।",
  },
};

function isDatasetRecord(value: unknown): value is DatasetRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.catalogUrl === "string" &&
    Array.isArray(record.formats)
  );
}

function isCatalogResponse(value: unknown): value is DatasetCatalogData {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.status === "ok" || record.status === "error") &&
    Array.isArray(record.datasets) &&
    record.datasets.every(isDatasetRecord) &&
    typeof record.total === "number" &&
    typeof record.page === "number" &&
    typeof record.limit === "number" &&
    typeof record.totalPages === "number" &&
    Array.isArray(record.categories) &&
    typeof record.retrievedAt === "string"
  );
}

function pageWindow(current: number, total: number): number[] {
  if (total <= 0) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function DatasetCard({ dataset }: { dataset: DatasetRecord }) {
  const language = useLanguage();
  const copy = COPY[language];
  const visibleTags = dataset.tags.slice(0, 3);

  return (
    <article className="flex h-full min-w-0 flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Badge tone="blue">{dataset.category}</Badge>
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-subtle">
          {dataset.formats.length > 0
            ? dataset.formats.join(" · ")
            : copy.formatNotListed}
        </span>
      </div>

      <h3
        className="mt-3 text-[14px] font-semibold leading-5 tracking-[-0.01em] text-foreground"
        title={dataset.title}
      >
        <span className="line-clamp-2">{dataset.title}</span>
      </h3>
      <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-muted">
        {dataset.description || copy.noDescription}
      </p>

      {visibleTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="max-w-[180px] truncate rounded bg-surface-muted px-1.5 py-0.5 text-[9px] text-subtle"
              title={tag}
            >
              {tag}
            </span>
          ))}
          {dataset.tags.length > visibleTags.length ? (
            <span className="rounded px-1 py-0.5 text-[9px] text-subtle">
              +{dataset.tags.length - visibleTags.length}
            </span>
          ) : null}
        </div>
      ) : null}

      <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[10px] leading-4">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-subtle">{copy.publisher}</dt>
          <dd
            className="line-clamp-2 text-right font-medium text-foreground-soft"
            title={dataset.sourceName ?? copy.notSpecified}
          >
            {dataset.sourceName ?? copy.notSpecified}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-subtle">{copy.licence}</dt>
          <dd className="text-right font-medium text-foreground-soft">
            {dataset.license ?? copy.notSpecified}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-subtle">{copy.catalogUpdated}</dt>
          <dd className="text-right font-medium text-foreground-soft">
            {formatUtcDate(dataset.updatedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-subtle">
        {dataset.downloads !== null ? (
          <span className="inline-flex items-center gap-1">
            <Download className="h-2.5 w-2.5" aria-hidden="true" />
            {copy.downloads(formatInteger(dataset.downloads))}
          </span>
        ) : null}
        {dataset.views !== null ? (
          <span className="inline-flex items-center gap-1">
            <Eye className="h-2.5 w-2.5" aria-hidden="true" />
            {copy.views(formatInteger(dataset.views))}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3">
        <SourceLink href={dataset.catalogUrl} className="text-[10px] font-medium">
          {copy.catalogRecord}
        </SourceLink>
        {dataset.sourceUrl ? (
          <SourceLink href={dataset.sourceUrl} className="text-[10px]">
            {copy.originalSource}
          </SourceLink>
        ) : null}
      </div>
    </article>
  );
}

function DatasetCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex justify-between gap-2">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-11/12" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <div className="mt-5 border-t border-line pt-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>
    </div>
  );
}

export function DataExplorer() {
  const language = useLanguage();
  const copy = COPY[language];
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<DatasetCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      setLoading(true);
      setError(null);

      const search = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (debouncedQuery) search.set("q", debouncedQuery);
      if (category) search.set("category", category);

      try {
        const response = await fetch(`/api/datasets?${search.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const payload: unknown = await response.json();

        if (!isCatalogResponse(payload)) {
          throw new Error("The catalog response did not have the expected shape.");
        }

        if (payload.status === "error") {
          throw new Error(payload.error ?? "The catalog could not be loaded.");
        }

        setData(payload);
      } catch {
        if (controller.signal.aborted) return;
        setError("catalog-error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCatalog();

    return () => controller.abort();
  }, [debouncedQuery, category, page, reloadKey]);

  const categories = useMemo(() => data?.categories ?? [], [data]);
  const stats = data?.stats ?? null;
  const pageNumbers = data ? pageWindow(data.page, data.totalPages) : [];
  const hasFilters = query.trim() !== "" || category !== "";
  const isInitialLoading = loading && data === null;

  const retry = useCallback(() => setReloadKey((current) => current + 1), []);

  function clearFilters() {
    setQuery("");
    setDebouncedQuery("");
    setCategory("");
    setPage(1);
  }

  const categoryOptions = useMemo(
    () =>
      categories.map((name) => ({
        name,
        count: stats?.categoryCounts[name] ?? null,
      })),
    [categories, stats],
  );

  return (
    <div className="space-y-5">
      <section
        aria-label={copy.statsAria}
        className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
          {[
            {
              label: copy.catalogDatasets,
              value: stats ? formatInteger(stats.totalDatasets) : "\u2014",
              icon: Database,
            },
            {
              label: copy.contributors,
              value: stats ? formatInteger(stats.totalContributors) : "\u2014",
              icon: Layers,
            },
            {
              label: copy.recordedDownloads,
              value: stats ? formatInteger(stats.totalDownloads) : "\u2014",
              icon: Download,
            },
            {
              label: copy.categories,
              value: stats
                ? formatInteger(Object.keys(stats.categoryCounts).length)
                : data
                  ? formatInteger(categories.length)
                  : "\u2014",
              icon: FileText,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="min-w-0 p-4">
                <div className="flex items-center gap-1.5 text-subtle">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  <p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em]">
                    {item.label}
                  </p>
                </div>
                <div className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-foreground tabular">
                  {isInitialLoading ? <Skeleton className="h-7 w-12" /> : item.value}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-muted/40 px-4 py-2 text-[9px] text-subtle">
          <p>{copy.publicCatalogNote}</p>
          <p>
            {copy.retrieved(
              data ? formatUtcDateTime(data.retrievedAt) : "\u2014",
            )}
          </p>
        </div>
      </section>

      <Panel>
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto] md:items-end">
          <div className="min-w-0">
            <label
              htmlFor="dataset-search"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle"
            >
              {copy.searchCatalog}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
                aria-hidden="true"
              />
              <input
                id="dataset-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-[12px] text-foreground placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={copy.clearSearch}
                  className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-subtle hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="dataset-category"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle"
            >
              {copy.category}
            </label>
            <select
              id="dataset-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[12px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            >
              <option value="">{copy.allCategories}</option>
              {categoryOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                  {option.count !== null ? ` (${option.count})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[11px] font-medium text-muted transition-colors hover:border-line-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.clear}
            </button>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{copy.resultsEyebrow}</p>
          <p className="mt-1 text-[12px] text-muted" aria-live="polite">
            {loading
              ? copy.loading
              : data
                ? copy.datasetCount(formatInteger(data.total), hasFilters)
                : copy.noResponse}
          </p>
        </div>
        {data && data.totalPages > 0 ? (
          <p className="text-[10px] text-subtle">
            {copy.pageInfo(data.page, data.totalPages)}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <DatasetCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <Panel>
          <ErrorState
            title={copy.errorTitle}
            description={copy.errorDescription}
            action={
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.retryCatalog}
              </button>
            }
            className="border-0 bg-transparent"
          />
        </Panel>
      ) : data && data.datasets.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Search}
            title={hasFilters ? copy.noMatchTitle : copy.emptyTitle}
            description={
              hasFilters
                ? copy.noMatchDescription
                : copy.emptyDescription
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {copy.clearFilters}
                </button>
              ) : undefined
            }
          />
        </Panel>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.datasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>

          {data.totalPages > 1 ? (
            <nav
              className="flex flex-col items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card sm:flex-row"
              aria-label={copy.pagination}
            >
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={data.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.previous}
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === data.page ? "page" : undefined}
                    className={cn(
                      "grid h-7 min-w-7 place-items-center rounded-md px-2 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      pageNumber === data.page
                        ? "bg-brand text-brand-contrast"
                        : "text-muted hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(data.totalPages, current + 1))
                }
                disabled={data.page >= data.totalPages || loading}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {copy.next}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </nav>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-muted/40 px-4 py-3 text-[10px] leading-4 text-subtle">
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {copy.footerNote}
        </p>
        <div className="flex items-center gap-3">
          <SourceLink href="https://opendatabd.com/" className="text-[10px] text-muted">
            OpenDataBD
          </SourceLink>
          <SourceLink
            href="https://www.opendatabd.com/api-docs"
            className="text-[10px] text-muted"
          >
            {copy.catalogHelp}
          </SourceLink>
          <a
            href="https://opendatabd.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {copy.visitCatalog}
            <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
            <span className="sr-only">
              {language === "bn" ? "(নতুন ট্যাবে খুলবে)" : "(opens in a new tab)"}
            </span>
          </a>
        </div>
      </div>

      <p className="text-[9px] leading-4 text-subtle">{copy.disclaimer}</p>
    </div>
  );
}
