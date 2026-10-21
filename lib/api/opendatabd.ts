import { unstable_cache } from "next/cache";
import {
  OPENDATABD_BASE_URL,
  OPENDATABD_CATALOG_CACHE_SECONDS,
  OPENDATABD_STATS_CACHE_SECONDS,
} from "@/lib/api/config";
import { fetchJson, isRecord, safeErrorMessage, UpstreamError } from "@/lib/api/http";
import type {
  DatasetCatalogData,
  DatasetPlatformStats,
  DatasetRecord,
} from "@/lib/api/types";

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Number.isInteger(value)
    ? value
    : null;
}

function optionalCount(value: unknown): number | null {
  return nonNegativeInteger(value);
}

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeFormats(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const formats = raw
    .filter((format): format is string => typeof format === "string")
    .map((format) => format.trim().toUpperCase())
    .filter((format) => format.length > 0 && format.length <= 12);

  return Array.from(new Set(formats)).slice(0, 6);
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function normalizeDataset(value: unknown): DatasetRecord | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id.trim() : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (!id || !title) return null;

  const description =
    typeof value.description === "string"
      ? value.description.replace(/\s+/g, " ").trim()
      : "";

  const category =
    typeof value.category === "string" && value.category.trim()
      ? value.category.trim()
      : "Uncategorized";

  const license =
    typeof value.license === "string" && value.license.trim()
      ? value.license.trim()
      : null;

  const sourceName =
    typeof value.source === "string" && value.source.trim()
      ? value.source.replace(/\s+/g, " ").trim()
      : null;

  return {
    id,
    title,
    description,
    category,
    formats: normalizeFormats(value.format),
    sourceName,
    sourceUrl: safeHttpUrl(value.source_url),
    catalogUrl: `${OPENDATABD_BASE_URL}/dataset-view.html?id=${encodeURIComponent(id)}`,
    license,
    tags: normalizeTags(value.tags),
    downloads: optionalCount(value.downloads),
    views: optionalCount(value.views),
    updatedAt: normalizeDate(value.updated_at),
  };
}

export interface DatasetQuery {
  q: string;
  category: string;
  page: number;
  limit: number;
}

interface CatalogPage {
  datasets: DatasetRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  retrievedAt: string;
}

async function fetchCatalogPage(query: DatasetQuery): Promise<CatalogPage> {
  const search = new URLSearchParams();
  if (query.q) search.set("q", query.q);
  if (query.category) search.set("category", query.category);
  search.set("page", String(query.page));
  search.set("limit", String(query.limit));

  const url = `${OPENDATABD_BASE_URL}/api/datasets?${search.toString()}`;
  const payload = await fetchJson(url);

  if (!isRecord(payload) || !Array.isArray(payload.datasets)) {
    throw new UpstreamError(
      "The OpenDataBD catalog returned an unexpected response shape.",
    );
  }

  const rawRows = payload.datasets;
  const normalized = rawRows
    .map(normalizeDataset)
    .filter((dataset): dataset is DatasetRecord => dataset !== null);

  if (rawRows.length > 0 && normalized.length === 0) {
    throw new UpstreamError(
      "The OpenDataBD catalog returned dataset records that did not validate.",
    );
  }

  const total = nonNegativeInteger(payload.total);
  const page = nonNegativeInteger(payload.page);
  const limit = nonNegativeInteger(payload.limit);

  if (total === null || page === null || limit === null || limit === 0) {
    throw new UpstreamError(
      "The OpenDataBD catalog response was missing pagination metadata.",
    );
  }

  return {
    datasets: normalized,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    retrievedAt: new Date().toISOString(),
  };
}

async function fetchPlatformStats(): Promise<DatasetPlatformStats> {
  const payload = await fetchJson(`${OPENDATABD_BASE_URL}/api/stats`);

  if (!isRecord(payload)) {
    throw new UpstreamError(
      "The OpenDataBD statistics endpoint returned an unexpected response.",
    );
  }

  const totalDatasets = nonNegativeInteger(payload.totalDatasets);
  const totalContributors = nonNegativeInteger(payload.totalContributors);
  const totalDownloads = nonNegativeInteger(payload.totalDownloads);

  if (
    totalDatasets === null ||
    totalContributors === null ||
    totalDownloads === null
  ) {
    throw new UpstreamError(
      "The OpenDataBD statistics response was missing expected totals.",
    );
  }

  const categoryCounts: Record<string, number> = {};
  if (isRecord(payload.categoryCounts)) {
    for (const [category, rawCount] of Object.entries(payload.categoryCounts)) {
      const count = nonNegativeInteger(rawCount);
      if (count !== null) categoryCounts[category] = count;
    }
  }

  return {
    totalDatasets,
    totalContributors,
    totalDownloads,
    categoryCounts,
    retrievedAt: new Date().toISOString(),
  };
}

const getCachedCatalogPage = unstable_cache(
  fetchCatalogPage,
  ["bizscope-opendatabd-catalog-v1"],
  {
    revalidate: OPENDATABD_CATALOG_CACHE_SECONDS,
    tags: ["opendatabd", "datasets"],
  },
);

const getCachedPlatformStats = unstable_cache(
  fetchPlatformStats,
  ["bizscope-opendatabd-stats-v1"],
  {
    revalidate: OPENDATABD_STATS_CACHE_SECONDS,
    tags: ["opendatabd", "datasets"],
  },
);

export async function getOpenDataBdStats(): Promise<DatasetPlatformStats> {
  return getCachedPlatformStats();
}

export async function getDatasetCatalog(
  query: DatasetQuery,
): Promise<DatasetCatalogData> {
  const [catalogResult, statsResult] = await Promise.allSettled([
    getCachedCatalogPage(query),
    getCachedPlatformStats(),
  ]);

  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;

  if (catalogResult.status === "rejected") {
    const fallbackCategories = stats
      ? Object.keys(stats.categoryCounts).sort((left, right) =>
          left.localeCompare(right),
        )
      : [];

    return {
      status: "error",
      datasets: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 0,
      stats,
      categories: fallbackCategories,
      retrievedAt: new Date().toISOString(),
      error: safeErrorMessage(
        catalogResult.reason,
        "The OpenDataBD dataset catalog could not be loaded right now.",
      ),
    };
  }

  const catalog = catalogResult.value;
  const categorySet = new Set<string>();

  if (stats) {
    for (const category of Object.keys(stats.categoryCounts)) {
      categorySet.add(category);
    }
  }

  for (const dataset of catalog.datasets) {
    categorySet.add(dataset.category);
  }

  return {
    status: "ok",
    datasets: catalog.datasets,
    total: catalog.total,
    page: catalog.page,
    limit: catalog.limit,
    totalPages: catalog.totalPages,
    stats,
    categories: Array.from(categorySet).sort((left, right) =>
      left.localeCompare(right),
    ),
    retrievedAt: catalog.retrievedAt,
    error: null,
  };
}
