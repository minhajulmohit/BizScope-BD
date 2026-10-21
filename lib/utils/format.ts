import type {
  EconomicIndicator,
  MetricUnit,
} from "@/lib/api/types";
import type { Language } from "@/lib/i18n";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatterCache = new Map<number, Intl.NumberFormat>();

function decimalFormatter(decimals: number): Intl.NumberFormat {
  const cached = decimalFormatterCache.get(decimals);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  decimalFormatterCache.set(decimals, formatter);
  return formatter;
}

const exactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const exactBdtFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const currencyDisplayNames: Record<Language, Intl.DisplayNames | null> = {
  en: null,
  bn: null,
};

export function getCurrencyName(
  code: string,
  language: Language = "en",
): string {
  if (!currencyDisplayNames[language]) {
    try {
      currencyDisplayNames[language] = new Intl.DisplayNames(
        [language === "bn" ? "bn" : "en"],
        { type: "currency" },
      );
    } catch {
      return code;
    }
  }

  try {
    const name = currencyDisplayNames[language]?.of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

export function formatUsdCompact(value: number): string {
  if (value < 0) {
    return `\u2212US$${compactFormatter.format(Math.abs(value))}`;
  }
  return `US$${compactFormatter.format(value)}`;
}

export function formatUsdExact(value: number): string {
  const formatted = exactUsdFormatter.format(value);
  if (formatted.startsWith("-$")) {
    return `\u2212US$${formatted.slice(2)}`;
  }
  return formatted.replace("$", "US$");
}

export function formatBdtCompact(value: number): string {
  if (value < 0) {
    return `\u2212\u09f3${compactFormatter.format(Math.abs(value))}`;
  }
  return `\u09f3${compactFormatter.format(value)}`;
}

export function formatBdtExact(value: number): string {
  const sign = value < 0 ? "\u2212" : "";
  return `${sign}BDT ${exactBdtFormatter.format(Math.abs(value))}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${decimalFormatter(decimals).format(value)}%`;
}

export function formatPercentPrecise(value: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  });
  return `${formatter.format(value)}%`;
}

export function formatRate(value: number): string {
  const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  return decimalFormatter(decimals).format(value);
}

export function formatSigned(value: number, decimals = 1, suffix = ""): string {
  if (value === 0) return `0${suffix}`;
  const sign = value > 0 ? "+" : "\u2212";
  return `${sign}${decimalFormatter(decimals).format(Math.abs(value))}${suffix}`;
}

export function formatIndicatorValue(
  indicator: EconomicIndicator,
  value: number,
): string {
  switch (indicator.unit) {
    case "usd":
      return formatUsdCompact(value);
    case "bdt":
      return formatBdtCompact(value);
    case "percent":
      return formatPercent(value, 1);
    case "people":
      return formatCompactNumber(value);
    default: {
      const exhaustive: never = indicator.unit;
      return exhaustive;
    }
  }
}

export function formatIndicatorExact(
  unit: MetricUnit,
  value: number,
  language: Language = "en",
): string {
  switch (unit) {
    case "usd":
      return formatUsdExact(value);
    case "bdt":
      return formatBdtExact(value);
    case "percent":
      return formatPercentPrecise(value);
    case "people":
      return language === "bn"
        ? `${integerFormatter.format(value)} জন`
        : `${integerFormatter.format(value)} people`;
    default: {
      const exhaustive: never = unit;
      return exhaustive;
    }
  }
}

export function formatUnitLabel(unit: MetricUnit): string {
  switch (unit) {
    case "usd":
      return "Current US$";
    case "bdt":
      return "BDT equivalent";
    case "percent":
      return "Percent";
    case "people":
      return "People";
    default: {
      const exhaustive: never = unit;
      return exhaustive;
    }
  }
}

export function formatAxisPercent(value: number): string {
  return `${compactFormatter.format(value)}%`;
}

export function formatAxisUsd(value: number): string {
  if (value < 0) {
    return `\u2212$${compactFormatter.format(Math.abs(value))}`;
  }
  return `$${compactFormatter.format(value)}`;
}

export function formatAxisBdt(value: number): string {
  if (value < 0) {
    return `\u2212\u09f3${compactFormatter.format(Math.abs(value))}`;
  }
  return `\u09f3${compactFormatter.format(value)}`;
}

export function formatAxisNumber(value: number): string {
  return compactFormatter.format(value);
}

export function formatUtcDate(value: string | null): string {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return dateFormatter.format(date);
}

export function formatUtcDateTime(value: string | null): string {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return `${dateFormatter.format(date)} \u00b7 ${timeFormatter.format(date)} UTC`;
}

export function formatObservationPeriod(
  year: number,
  language: Language = "en",
): string {
  return language === "bn" ? `বার্ষিক · ${year}` : `Annual \u00b7 ${year}`;
}

export function clampInteger(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
