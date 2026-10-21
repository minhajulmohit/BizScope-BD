import type {
  EconomicIndicator,
  EconomicObservation,
  MetricDelta,
  MetricUnit,
} from "@/lib/api/types";
import type { Language } from "@/lib/i18n";
import { formatPercent, formatSigned } from "@/lib/utils/format";

/**
 * Only compute a change when the two most recent available observations are
 * consecutive annual periods. This avoids presenting multi-year gaps as a
 * one-year change.
 */
export function getIndicatorDelta(
  indicator: EconomicIndicator,
  language: Language = "en",
): MetricDelta | null {
  const { latest, previous } = indicator;
  if (!latest || !previous) return null;
  if (latest.year - previous.year !== 1) return null;

  const difference = latest.value - previous.value;
  if (difference === 0) {
    return {
      direction: "flat",
      amountLabel: "0.0",
      previousYear: previous.year,
    };
  }

  if (indicator.unit === "percent") {
    return {
      direction: difference > 0 ? "up" : "down",
      amountLabel: formatSigned(
        difference,
        1,
        language === "bn" ? " শতাংশ পয়েন্ট" : " pp",
      ),
      previousYear: previous.year,
    };
  }

  if (previous.value === 0) return null;

  const percentage = (difference / previous.value) * 100;
  return {
    direction: difference > 0 ? "up" : "down",
    amountLabel: formatSigned(percentage, 1, "%"),
    previousYear: previous.year,
  };
}

export function getObservationChangeLabel(
  unit: MetricUnit,
  current: number | null,
  previous: number | null,
  language: Language = "en",
): string {
  if (current === null || previous === null) return "\u2014";

  const difference = current - previous;
  if (unit === "percent") {
    return formatSigned(
      difference,
      1,
      language === "bn" ? " শতাংশ পয়েন্ট" : " pp",
    );
  }
  if (previous === 0) return "\u2014";
  return formatSigned((difference / previous) * 100, 1, "%");
}

export function densifyObservations(
  observations: EconomicObservation[],
  fromYear?: number,
  toYear?: number,
): EconomicObservation[] {
  if (observations.length === 0) return [];

  const sorted = [...observations].sort((a, b) => a.year - b.year);
  const minYear = fromYear ?? sorted[0].year;
  const maxYear = toYear ?? sorted[sorted.length - 1].year;
  const byYear = new Map(sorted.map((observation) => [observation.year, observation.value]));
  const rows: EconomicObservation[] = [];

  for (let year = minYear; year <= maxYear; year += 1) {
    rows.push({ year, value: byYear.get(year) ?? null });
  }

  return rows;
}

/**
 * A merged annual series for two indicators. Only years present in either
 * source series are included; no interpolation or synthetic values are added.
 */
export function mergeIndicatorSeries(
  left: EconomicIndicator | null,
  right: EconomicIndicator | null,
): Array<{ year: number; left: number | null; right: number | null }> {
  const rows = new Map<number, { year: number; left: number | null; right: number | null }>();

  for (const observation of left?.observations ?? []) {
    rows.set(observation.year, {
      year: observation.year,
      left: observation.value,
      right: null,
    });
  }

  for (const observation of right?.observations ?? []) {
    const existing = rows.get(observation.year);
    if (existing) {
      existing.right = observation.value;
    } else {
      rows.set(observation.year, {
        year: observation.year,
        left: null,
        right: observation.value,
      });
    }
  }

  return Array.from(rows.values()).sort((a, b) => a.year - b.year);
}

export function describeGaps(observations: EconomicObservation[]): string | null {
  if (observations.length < 2) return null;
  const sorted = [...observations].sort((a, b) => a.year - b.year);
  const gaps: string[] = [];

  for (let index = 1; index < sorted.length; index += 1) {
    const difference = sorted[index].year - sorted[index - 1].year;
    if (difference > 1) {
      gaps.push(`${sorted[index - 1].year}\u2013${sorted[index].year}`);
    }
  }

  return gaps.length > 0 ? gaps.join(", ") : null;
}

export function percentage(value: number): string {
  return formatPercent(value, 1);
}
