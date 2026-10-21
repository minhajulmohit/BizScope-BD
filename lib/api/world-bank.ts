import { unstable_cache } from "next/cache";
import {
  WORLD_BANK_API_BASE,
  WORLD_BANK_CACHE_SECONDS,
  WORLD_BANK_LICENSE,
  WORLD_BANK_SOURCE_URL,
} from "@/lib/api/config";
import { fetchJson, isRecord, safeErrorMessage, UpstreamError } from "@/lib/api/http";
import type {
  AnalyticsData,
  AnalyticsSummary,
  AvailableObservation,
  EconomicIndicator,
  EconomicObservation,
  IndicatorKey,
  ProviderIssue,
} from "@/lib/api/types";
import { INDICATOR_DEFINITIONS, INDICATOR_ORDER } from "@/lib/indicator-catalog";

interface ParsedIndicator {
  observations: EconomicObservation[];
  datasetUpdated: string | null;
  latest: AvailableObservation | null;
  previous: AvailableObservation | null;
}

function buildIndicatorApiUrl(code: string): string {
  return `${WORLD_BANK_API_BASE}/country/BGD/indicator/${encodeURIComponent(code)}?format=json&mrnev=10`;
}

function toValidTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

function parseWorldBankPayload(payload: unknown): ParsedIndicator {
  if (!Array.isArray(payload) || payload.length < 2) {
    throw new UpstreamError(
      "The World Bank response did not have the documented shape.",
    );
  }

  const meta = payload[0];
  if (isRecord(meta) && "message" in meta) {
    throw new UpstreamError("The World Bank rejected the indicator request.");
  }

  const rows = payload[1];
  if (!Array.isArray(rows)) {
    throw new UpstreamError("The World Bank returned no observation rows.");
  }

  const byYear = new Map<number, EconomicObservation>();

  for (const row of rows) {
    if (!isRecord(row)) continue;

    if (
      typeof row.countryiso3code === "string" &&
      row.countryiso3code !== "BGD"
    ) {
      continue;
    }

    const year =
      typeof row.date === "string" && /^\d{4}$/.test(row.date)
        ? Number.parseInt(row.date, 10)
        : Number.NaN;

    if (!Number.isInteger(year) || year < 1900 || year > 2100) continue;

    const value =
      typeof row.value === "number" && Number.isFinite(row.value)
        ? row.value
        : null;

    byYear.set(year, { year, value });
  }

  const observations = Array.from(byYear.values()).sort(
    (left, right) => left.year - right.year,
  );

  if (observations.length === 0) {
    throw new UpstreamError(
      "No valid Bangladesh observations were returned for this indicator.",
    );
  }

  const available = observations
    .filter(
      (observation): observation is AvailableObservation =>
        observation.value !== null,
    )
    .sort((left, right) => right.year - left.year);

  return {
    observations,
    datasetUpdated: isRecord(meta) ? toValidTimestamp(meta.lastupdated) : null,
    latest: available[0] ?? null,
    previous: available[1] ?? null,
  };
}

async function fetchWorldBankIndicator(
  key: IndicatorKey,
): Promise<EconomicIndicator> {
  const definition = INDICATOR_DEFINITIONS[key];
  const apiUrl = buildIndicatorApiUrl(definition.code);
  const payload = await fetchJson(apiUrl);
  const parsed = parseWorldBankPayload(payload);
  const retrievedAt = new Date().toISOString();

  return {
    key: definition.key,
    code: definition.code,
    name: definition.name,
    shortName: definition.shortName,
    definition: definition.definition,
    unit: definition.unit,
    unitLabel: definition.unitLabel,
    valueDecimals: definition.valueDecimals,
    frequency: "Annual",
    observations: parsed.observations,
    latest: parsed.latest,
    previous: parsed.previous,
    source: {
      provider: "World Bank",
      providerId: "world-bank",
      homepageUrl: WORLD_BANK_SOURCE_URL,
      sourceUrl: `https://data.worldbank.org/indicator/${definition.code}?locations=BD`,
      apiUrl,
      license: WORLD_BANK_LICENSE,
      cadence: "periodic",
      cadenceLabel: "Annual · periodically revised",
      datasetUpdated: parsed.datasetUpdated,
      retrievedAt,
    },
  };
}

/**
 * Cache each indicator independently. A failure for one indicator does not
 * poison the cache for the others, and successful indicators keep their real
 * upstream retrieval timestamp.
 */
const getCachedIndicator = unstable_cache(
  fetchWorldBankIndicator,
  ["bizscope-world-bank-indicator-v1"],
  {
    revalidate: WORLD_BANK_CACHE_SECONDS,
    tags: ["world-bank", "analytics"],
  },
);

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const generatedAt = new Date().toISOString();
  const settled = await Promise.allSettled(
    INDICATOR_ORDER.map((key) => getCachedIndicator(key)),
  );

  const indicators = Object.fromEntries(
    INDICATOR_ORDER.map((key) => [key, null]),
  ) as Record<IndicatorKey, EconomicIndicator | null>;

  const errors: ProviderIssue[] = [];
  let latestObservationYear: number | null = null;
  let lastProviderUpdate: string | null = null;
  let lastSuccessfulRetrieval: string | null = null;

  settled.forEach((result, index) => {
    const key = INDICATOR_ORDER[index];

    if (result.status === "fulfilled") {
      const indicator = result.value;
      indicators[key] = indicator;

      if (indicator.latest) {
        latestObservationYear =
          latestObservationYear === null
            ? indicator.latest.year
            : Math.max(latestObservationYear, indicator.latest.year);
      }

      if (indicator.source.datasetUpdated) {
        lastProviderUpdate =
          lastProviderUpdate === null ||
          indicator.source.datasetUpdated > lastProviderUpdate
            ? indicator.source.datasetUpdated
            : lastProviderUpdate;
      }

      if (
        lastSuccessfulRetrieval === null ||
        indicator.source.retrievedAt > lastSuccessfulRetrieval
      ) {
        lastSuccessfulRetrieval = indicator.source.retrievedAt;
      }
    } else {
      errors.push({
        provider: "World Bank",
        scope: INDICATOR_DEFINITIONS[key].shortName,
        message: safeErrorMessage(
          result.reason,
          "The indicator could not be loaded from the World Bank API.",
        ),
        occurredAt: generatedAt,
      });
    }
  });

  const availableIndicators = INDICATOR_ORDER.filter(
    (key) => indicators[key]?.latest != null,
  ).length;

  const status =
    availableIndicators === 0
      ? "error"
      : availableIndicators === INDICATOR_ORDER.length
        ? "ok"
        : "partial";

  const summary: AnalyticsSummary = {
    availableIndicators,
    totalIndicators: INDICATOR_ORDER.length,
    latestObservationYear,
    lastProviderUpdate,
    lastSuccessfulRetrieval,
  };

  return {
    status,
    generatedAt,
    indicators,
    errors,
    summary,
  };
}
