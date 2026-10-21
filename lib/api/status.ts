import { getAnalyticsData } from "@/lib/api/world-bank";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { getOpenDataBdStats } from "@/lib/api/opendatabd";
import type {
  ProviderHealth,
  ProviderStatus,
  StatusData,
} from "@/lib/api/types";

function overallHealth(providers: ProviderStatus[]): ProviderHealth {
  const operational = providers.filter(
    (provider) => provider.status === "operational",
  ).length;
  const degraded = providers.filter(
    (provider) => provider.status === "degraded",
  ).length;

  if (operational === providers.length) return "operational";
  if (operational === 0 && degraded === 0) return "unavailable";
  return "degraded";
}

export async function getStatusData(): Promise<StatusData> {
  const [analyticsResult, currencyResult, catalogResult] =
    await Promise.allSettled([
      getAnalyticsData(),
      getCurrencyData(),
      getOpenDataBdStats(),
    ]);

  const analytics =
    analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
  const currency =
    currencyResult.status === "fulfilled" ? currencyResult.value : null;
  const catalog =
    catalogResult.status === "fulfilled" ? catalogResult.value : null;

  const providers: ProviderStatus[] = [
    {
      id: "world-bank",
      name: "World Bank WDI",
      status: analytics
        ? analytics.status === "ok"
          ? "operational"
          : analytics.status === "partial"
            ? "degraded"
            : "unavailable"
        : "unavailable",
      cadence: "periodic",
      cadenceLabel: "Annual · periodically revised",
      detail: analytics
        ? `${analytics.summary.availableIndicators} of ${analytics.summary.totalIndicators} indicators available`
        : "The World Bank data could not be reached.",
      detailData: analytics
        ? {
            available: analytics.summary.availableIndicators,
            total: analytics.summary.totalIndicators,
          }
        : undefined,
      lastRetrievedAt: analytics?.summary.lastSuccessfulRetrieval ?? null,
    },
    {
      id: "exchange-rates",
      name: "ExchangeRate-API",
      status: currency?.status === "ok" ? "operational" : "unavailable",
      cadence: "daily",
      cadenceLabel: "Daily reference · third-party",
      detail:
        currency?.status === "ok"
          ? "Dollar–taka reference rates are available."
          : "The daily currency reference could not be reached.",
      lastRetrievedAt: currency?.retrievedAt ?? null,
    },
    {
      id: "opendatabd",
      name: "OpenDataBD",
      status: catalog ? "operational" : "unavailable",
      cadence: "catalog",
      cadenceLabel: "Catalog · on-demand",
      detail: catalog
        ? `${catalog.totalDatasets} catalog datasets available.`
        : "The public catalog could not be reached.",
      detailData: catalog ? { datasets: catalog.totalDatasets } : undefined,
      lastRetrievedAt: catalog?.retrievedAt ?? null,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    overall: overallHealth(providers),
    providers,
  };
}
