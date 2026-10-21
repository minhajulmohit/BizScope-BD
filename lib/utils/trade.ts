import type { EconomicIndicator } from "@/lib/api/types";

export interface TradeYear {
  year: number;
  exports: number | null;
  imports: number | null;
  balance: number | null;
  coverageRatio: number | null;
}

/**
 * Trade balance is only calculated when exports and imports are present for
 * the same year and come from the same World Bank definition (goods and
 * services, current US dollars). Nothing is interpolated.
 */
export function buildTradeSeries(
  exportsIndicator: EconomicIndicator | null,
  importsIndicator: EconomicIndicator | null,
): TradeYear[] {
  const rows = new Map<number, TradeYear>();

  for (const observation of exportsIndicator?.observations ?? []) {
    rows.set(observation.year, {
      year: observation.year,
      exports: observation.value,
      imports: null,
      balance: null,
      coverageRatio: null,
    });
  }

  for (const observation of importsIndicator?.observations ?? []) {
    const row = rows.get(observation.year);
    if (row) {
      row.imports = observation.value;
    } else {
      rows.set(observation.year, {
        year: observation.year,
        exports: null,
        imports: observation.value,
        balance: null,
        coverageRatio: null,
      });
    }
  }

  const series = Array.from(rows.values()).sort((a, b) => a.year - b.year);

  for (const row of series) {
    if (
      row.exports !== null &&
      row.imports !== null &&
      Number.isFinite(row.exports) &&
      Number.isFinite(row.imports)
    ) {
      row.balance = row.exports - row.imports;
      row.coverageRatio = row.imports > 0 ? (row.exports / row.imports) * 100 : null;
    }
  }

  return series;
}

export function latestComparableTradeYear(series: TradeYear[]): TradeYear | null {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index].balance !== null) return series[index];
  }
  return null;
}

export function latestTradeObservation(
  series: TradeYear[],
  key: "exports" | "imports",
): TradeYear | null {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index][key] !== null) return series[index];
  }
  return null;
}
