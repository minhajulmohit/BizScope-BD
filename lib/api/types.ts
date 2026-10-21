/**
 * Shared, serialisable types for every server-to-client data boundary.
 * Nothing in this file should depend on a specific upstream response shape.
 */

export type IndicatorKey =
  | "gdp"
  | "gdpGrowth"
  | "inflation"
  | "exports"
  | "imports"
  | "unemployment"
  | "population";

export type MetricUnit = "usd" | "bdt" | "percent" | "people";

export type DataCadence = "daily" | "periodic" | "catalog" | "manual";

export type Availability = "ok" | "partial" | "error";

export type Direction = "up" | "down" | "flat";

export interface EconomicObservation {
  year: number;
  value: number | null;
}

export interface AvailableObservation {
  year: number;
  value: number;
}

export interface ProviderIssue {
  provider: string;
  scope: string;
  message: string;
  occurredAt: string;
}

export interface IndicatorSource {
  provider: string;
  providerId: "world-bank";
  homepageUrl: string;
  sourceUrl: string;
  apiUrl: string;
  license: string;
  cadence: DataCadence;
  cadenceLabel: string;
  datasetUpdated: string | null;
  retrievedAt: string;
}

export interface EconomicIndicator {
  key: IndicatorKey;
  code: string;
  name: string;
  shortName: string;
  definition: string;
  unit: MetricUnit;
  unitLabel: string;
  valueDecimals: number;
  frequency: "Annual";
  observations: EconomicObservation[];
  latest: AvailableObservation | null;
  previous: AvailableObservation | null;
  source: IndicatorSource;
}

export interface AnalyticsSummary {
  availableIndicators: number;
  totalIndicators: number;
  latestObservationYear: number | null;
  lastProviderUpdate: string | null;
  lastSuccessfulRetrieval: string | null;
}

export interface AnalyticsData {
  status: Availability;
  generatedAt: string;
  indicators: Record<IndicatorKey, EconomicIndicator | null>;
  errors: ProviderIssue[];
  summary: AnalyticsSummary;
}

export interface MetricDelta {
  direction: Direction;
  amountLabel: string;
  previousYear: number;
}

export interface CurrencyQuote {
  code: string;
  unitsPerUsd: number;
}

export interface CurrencySource {
  provider: string;
  homepageUrl: string;
  documentationUrl: string;
  termsUrl: string;
  cadence: DataCadence;
  cadenceLabel: string;
}

export interface CurrencyData {
  status: "ok" | "error";
  base: "USD";
  rates: CurrencyQuote[];
  bdtRate: number | null;
  lastUpdatedUtc: string | null;
  nextUpdateUtc: string | null;
  retrievedAt: string;
  source: CurrencySource;
  disclaimer: string;
  error: string | null;
}

export interface DatasetRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  formats: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  catalogUrl: string;
  license: string | null;
  tags: string[];
  downloads: number | null;
  views: number | null;
  updatedAt: string | null;
}

export interface DatasetPlatformStats {
  totalDatasets: number;
  totalContributors: number;
  totalDownloads: number;
  categoryCounts: Record<string, number>;
  retrievedAt: string;
}

export interface DatasetCatalogData {
  status: "ok" | "error";
  datasets: DatasetRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: DatasetPlatformStats | null;
  categories: string[];
  retrievedAt: string;
  error: string | null;
}

export type ProviderHealth =
  | "operational"
  | "degraded"
  | "unavailable";

export interface ProviderStatus {
  id: "world-bank" | "exchange-rates" | "opendatabd";
  name: string;
  status: ProviderHealth;
  cadence: DataCadence;
  cadenceLabel: string;
  detail: string;
  lastRetrievedAt: string | null;
}

export interface StatusData {
  generatedAt: string;
  overall: ProviderHealth;
  providers: ProviderStatus[];
}

export type IntegrationStatus = "integrated" | "official-link" | "directory";

export interface SourceEndpoint {
  label: string;
  url: string;
  format: string;
}

export interface SourceRegistryEntry {
  id: string;
  name: string;
  shortName: string;
  role: string;
  cadence: DataCadence;
  cadenceLabel: string;
  integration: IntegrationStatus;
  integrationLabel: string;
  accessNote: string;
  freshnessNote: string;
  homepageUrl: string;
  documentationUrl: string | null;
  license: string;
  licenseUrl: string | null;
  endpoints: SourceEndpoint[];
}
