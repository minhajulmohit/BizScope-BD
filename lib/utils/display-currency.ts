import type {
  AnalyticsData,
  AvailableObservation,
  EconomicIndicator,
  IndicatorKey,
} from "@/lib/api/types";

export const BDT_CONVERTED_KEYS: Array<Extract<IndicatorKey, "gdp" | "exports" | "imports">> = [
  "gdp",
  "exports",
  "imports",
];

function convertObservation(
  observation: AvailableObservation,
  bdtPerUsd: number,
): AvailableObservation {
  return {
    year: observation.year,
    value: observation.value * bdtPerUsd,
  };
}

export function convertIndicatorToBdt(
  indicator: EconomicIndicator,
  bdtPerUsd: number,
): EconomicIndicator {
  if (indicator.unit !== "usd" || !Number.isFinite(bdtPerUsd) || bdtPerUsd <= 0) {
    return indicator;
  }

  return {
    ...indicator,
    name: indicator.name.replace("(current US$)", "(BDT equivalent)"),
    unit: "bdt",
    unitLabel: "BDT equivalent",
    observations: indicator.observations.map((observation) => ({
      year: observation.year,
      value:
        observation.value === null
          ? null
          : observation.value * bdtPerUsd,
    })),
    latest: indicator.latest
      ? convertObservation(indicator.latest, bdtPerUsd)
      : null,
    previous: indicator.previous
      ? convertObservation(indicator.previous, bdtPerUsd)
      : null,
  };
}

/**
 * Converts only the USD-published World Bank series. Percentages and
 * population are left untouched, and the source metadata is preserved.
 */
export function convertAnalyticsToBdt(
  analytics: AnalyticsData,
  bdtPerUsd: number | null,
): AnalyticsData {
  if (bdtPerUsd === null || !Number.isFinite(bdtPerUsd) || bdtPerUsd <= 0) {
    return analytics;
  }

  const indicators = { ...analytics.indicators };
  for (const key of BDT_CONVERTED_KEYS) {
    const indicator = indicators[key];
    if (indicator) {
      indicators[key] = convertIndicatorToBdt(indicator, bdtPerUsd);
    }
  }

  return { ...analytics, indicators };
}
