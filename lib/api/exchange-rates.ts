import { unstable_cache } from "next/cache";
import {
  CURRENCY_API_URL,
  CURRENCY_CACHE_SECONDS,
  DISCLAIMER_CURRENCY,
} from "@/lib/api/config";
import { fetchJson, isRecord, safeErrorMessage, UpstreamError } from "@/lib/api/http";
import type { CurrencyData, CurrencyQuote } from "@/lib/api/types";

const CURRENCY_SOURCE: CurrencyData["source"] = {
  provider: "ExchangeRate-API",
  homepageUrl: "https://www.exchangerate-api.com/",
  documentationUrl: "https://www.exchangerate-api.com/docs/free",
  termsUrl: "https://www.exchangerate-api.com/terms",
  cadence: "daily",
  cadenceLabel: "Daily reference · third-party",
};

function parseProviderTime(
  rawString: unknown,
  rawUnix: unknown,
): string | null {
  if (typeof rawString === "string") {
    const timestamp = Date.parse(rawString);
    if (!Number.isNaN(timestamp)) return new Date(timestamp).toISOString();
  }

  if (
    typeof rawUnix === "number" &&
    Number.isFinite(rawUnix) &&
    rawUnix > 0
  ) {
    return new Date(rawUnix * 1000).toISOString();
  }

  return null;
}

async function fetchExchangeRates(): Promise<CurrencyData> {
  const payload = await fetchJson(CURRENCY_API_URL, { timeoutMs: 10_000 });

  if (!isRecord(payload)) {
    throw new UpstreamError("The currency feed returned an unexpected response.");
  }

  if (payload.result !== "success") {
    throw new UpstreamError("The currency feed did not report a successful result.");
  }

  if (payload.base_code !== "USD" || !isRecord(payload.rates)) {
    throw new UpstreamError("The currency feed did not return USD-based rates.");
  }

  const quotes: CurrencyQuote[] = [];

  for (const [rawCode, rawRate] of Object.entries(payload.rates)) {
    const code = rawCode.toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) continue;
    if (typeof rawRate !== "number" || !Number.isFinite(rawRate) || rawRate <= 0) {
      continue;
    }
    quotes.push({ code, unitsPerUsd: rawRate });
  }

  quotes.sort((left, right) => left.code.localeCompare(right.code));

  const bdtRate =
    quotes.find((quote) => quote.code === "BDT")?.unitsPerUsd ?? null;

  if (quotes.length === 0 || bdtRate === null) {
    throw new UpstreamError(
      "The currency feed did not include a valid Bangladeshi taka rate.",
    );
  }

  return {
    status: "ok",
    base: "USD",
    rates: quotes,
    bdtRate,
    lastUpdatedUtc: parseProviderTime(
      payload.time_last_update_utc,
      payload.time_last_update_unix,
    ),
    nextUpdateUtc: parseProviderTime(
      payload.time_next_update_utc,
      payload.time_next_update_unix,
    ),
    retrievedAt: new Date().toISOString(),
    source: CURRENCY_SOURCE,
    disclaimer: DISCLAIMER_CURRENCY,
    error: null,
  };
}

const getCachedCurrencyData = unstable_cache(
  fetchExchangeRates,
  ["bizscope-exchange-rates-v1"],
  {
    revalidate: CURRENCY_CACHE_SECONDS,
    tags: ["exchange-rates", "currency"],
  },
);

export async function getCurrencyData(): Promise<CurrencyData> {
  try {
    return await getCachedCurrencyData();
  } catch (error) {
    return {
      status: "error",
      base: "USD",
      rates: [],
      bdtRate: null,
      lastUpdatedUtc: null,
      nextUpdateUtc: null,
      retrievedAt: new Date().toISOString(),
      source: CURRENCY_SOURCE,
      disclaimer: DISCLAIMER_CURRENCY,
      error: safeErrorMessage(
        error,
        "The third-party currency reference feed could not be loaded.",
      ),
    };
  }
}
