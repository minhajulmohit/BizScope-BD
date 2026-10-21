"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  Search,
} from "lucide-react";
import type { CurrencyData } from "@/lib/api/types";
import { formatRate, formatUtcDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { EmptyState } from "@/components/ui/states";

const AMOUNT_LIMIT = 1_000_000_000_000;

function convertedFormatter(value: number): string {
  const absolute = Math.abs(value);
  const maximumFractionDigits = absolute > 0 && absolute < 1 ? 6 : absolute < 100 ? 4 : 2;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

function effectiveRateFormatter(value: number): string {
  const absolute = Math.abs(value);
  const decimals = absolute >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value);
}

function bdtPerUnitFormatter(value: number): string {
  const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  return `৳${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

function CurrencySelect({
  id,
  label,
  value,
  codes,
  currencyNames,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  codes: string[];
  currencyNames: Record<string, string>;
  onChange: (code: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[12px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        {codes.map((code) => (
          <option key={code} value={code}>
            {code} — {currencyNames[code] ?? code}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CurrencyWorkspace({
  data,
  currencyNames,
}: {
  data: CurrencyData;
  currencyNames: Record<string, string>;
}) {
  const rateMap = useMemo(
    () => new Map(data.rates.map((quote) => [quote.code, quote.unitsPerUsd])),
    [data.rates],
  );

  const codes = useMemo(() => data.rates.map((quote) => quote.code), [data.rates]);

  const [amount, setAmount] = useState("100");
  const [fromCode, setFromCode] = useState("USD");
  const [toCode, setToCode] = useState("BDT");
  const [query, setQuery] = useState("");

  const trimmedAmount = amount.trim();
  const amountPatternValid = /^\d*(\.\d*)?$/.test(trimmedAmount);
  const numericAmount = Number(trimmedAmount);
  const amountValid =
    trimmedAmount !== "" &&
    amountPatternValid &&
    Number.isFinite(numericAmount) &&
    numericAmount >= 0 &&
    numericAmount <= AMOUNT_LIMIT;

  const fromRate = rateMap.get(fromCode) ?? null;
  const toRate = rateMap.get(toCode) ?? null;
  const hasConversionRate = fromRate !== null && fromRate > 0 && toRate !== null;
  const convertedValue =
    amountValid && hasConversionRate ? numericAmount * (toRate / fromRate) : null;
  const effectiveRate =
    hasConversionRate && fromRate > 0 ? toRate / fromRate : null;

  const filteredRates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.rates;

    return data.rates.filter((quote) => {
      const name = (currencyNames[quote.code] ?? "").toLowerCase();
      return (
        quote.code.toLowerCase().includes(normalized) ||
        name.includes(normalized)
      );
    });
  }, [currencyNames, data.rates, query]);

  const bdtRate = data.bdtRate;

  function rateInBdt(unitsPerUsd: number): number | null {
    if (bdtRate === null || bdtRate <= 0 || unitsPerUsd <= 0) return null;
    return bdtRate / unitsPerUsd;
  }

  function swapCurrencies() {
    setFromCode(toCode);
    setToCode(fromCode);
  }

  return (
    <div className="space-y-4">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.35fr)]">
        <Panel className="relative overflow-hidden border-brand/25">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-brand" aria-hidden="true" />
          <div className="p-5 pt-6 sm:p-6 sm:pt-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">US dollar → taka</p>
                <h2 className="mt-1 text-[13px] font-semibold text-foreground">
                  Bangladeshi taka per US dollar
                </h2>
              </div>
              <CadenceBadge cadence="daily" label="Daily reference" />
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[2.8rem] font-semibold leading-none tracking-[-0.055em] text-foreground tabular">
                {data.bdtRate !== null ? formatRate(data.bdtRate) : "\u2014"}
              </span>
              <span className="text-sm font-semibold text-muted">BDT</span>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              1 US dollar equals {data.bdtRate !== null ? formatRate(data.bdtRate) : "\u2014"}{" "}
              Bangladeshi taka at the latest daily reference update.
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-4 text-[10px] sm:grid-cols-2">
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  Rate updated
                </dt>
                <dd className="mt-1 text-[11px] font-medium leading-4 text-foreground-soft">
                  {formatUtcDateTime(data.lastUpdatedUtc)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  Next expected update
                </dt>
                <dd className="mt-1 text-[11px] font-medium leading-4 text-foreground-soft">
                  {formatUtcDateTime(data.nextUpdateUtc)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  Checked by BizScope
                </dt>
                <dd className="mt-1 text-[11px] font-medium leading-4 text-foreground-soft">
                  {formatUtcDateTime(data.retrievedAt)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  Base currency
                </dt>
                <dd className="mt-1 text-[11px] font-medium leading-4 text-foreground-soft">
                  Reference currency · US dollar
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-line bg-surface-muted/60 px-5 py-3.5 sm:px-6">
            <p className="text-[10px] leading-4 text-muted">{data.disclaimer}</p>
            <div className="mt-1.5">
              <SourceLink
                href={data.source.homepageUrl}
                className="text-[10px] text-muted"
              >
                Currency data from {data.source.provider}
              </SourceLink>
            </div>
          </div>
        </Panel>

        <Panel className="min-w-0">
          <PanelHeader
            title="Currency converter"
            description="Convert between currencies using the same daily reference update."
            action={
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                {data.rates.length} currencies
              </span>
            }
          />
          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <label
                htmlFor="converter-amount"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle"
              >
                Amount
              </label>
              <input
                id="converter-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={!amountValid}
                aria-describedby="converter-amount-help"
                className={cn(
                  "h-11 w-full rounded-lg border bg-surface px-3 text-[15px] font-semibold tabular text-foreground outline-none transition-colors focus:ring-2",
                  amountValid
                    ? "border-line focus:border-brand focus:ring-brand/25"
                    : "border-danger/60 focus:border-danger focus:ring-danger/20",
                )}
              />
              <p
                id="converter-amount-help"
                className={cn(
                  "mt-1.5 text-[10px] leading-4",
                  amountValid ? "text-subtle" : "text-danger",
                )}
                role={!amountValid ? "alert" : undefined}
              >
                {amountValid
                  ? "Enter a non-negative number. Conversions use the same daily reference update."
                  : "Enter a valid non-negative number, up to 1 trillion, using a period for decimals."}
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
              <CurrencySelect
                id="converter-from"
                label="From"
                value={fromCode}
                codes={codes}
                currencyNames={currencyNames}
                onChange={setFromCode}
              />
              <button
                type="button"
                onClick={swapCurrencies}
                className="mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-label="Swap source and destination currencies"
                title="Swap currencies"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <CurrencySelect
                id="converter-to"
                label="To"
                value={toCode}
                codes={codes}
                currencyNames={currencyNames}
                onChange={setToCode}
              />
            </div>

            <div
              className="rounded-xl border border-line bg-surface-muted/50 p-4"
              aria-live="polite"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
                <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                Converted amount
              </div>
              {convertedValue !== null ? (
                <>
                  <p className="mt-2 break-words text-[1.65rem] font-semibold leading-tight tracking-[-0.035em] text-foreground tabular">
                    {convertedFormatter(convertedValue)}{" "}
                    <span className="text-sm font-semibold text-muted">{toCode}</span>
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted">
                    {convertedFormatter(numericAmount)} {fromCode} at a reference
                    rate of 1 {fromCode} ={" "}
                    {effectiveRate !== null
                      ? effectiveRateFormatter(effectiveRate)
                      : "\u2014"}{" "}
                    {toCode}.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[15px] font-medium text-subtle">
                  Enter a valid amount and currencies to convert.
                </p>
              )}
            </div>

            <p className="text-[10px] leading-4 text-subtle">
              Conversions use the currency service&apos;s daily reference rates.
              They are indicative values, not a transaction quote. The same
              update time applies to all rates.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Reference rate table"
          description="How much one unit of each currency is worth in Bangladeshi taka. Search by currency code or name."
          action={
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {formatUtcDateTime(data.lastUpdatedUtc)}
            </span>
          }
        />
        <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative w-full max-w-xs">
            <label htmlFor="rate-search" className="sr-only">
              Search currency rates
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="rate-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search currency or code"
              className="h-8 w-full rounded-md border border-line bg-surface pl-8 pr-2.5 text-[11px] text-foreground placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <p className="text-[10px] text-subtle" aria-live="polite">
            Showing {filteredRates.length} of {data.rates.length} currencies
          </p>
        </div>
        {filteredRates.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No currencies match"
            description="Try a three-letter currency code such as BDT, USD, or EUR."
          />
        ) : (
          <div
            className="max-h-[460px] overflow-auto scrollbar-subtle"
            role="region"
            aria-label="Reference rate table"
            tabIndex={0}
          >
            <table className="w-full min-w-[460px] text-left text-[12px]">
              <caption className="sr-only">
                Third-party reference rates expressed as Bangladeshi taka per one
                unit of each currency
              </caption>
              <thead className="sticky top-0 z-10 bg-surface-muted">
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Currency
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Code
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    Taka per 1 unit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRates.map((quote) => {
                  const isBdt = quote.code === "BDT";
                  const isSelected =
                    quote.code === fromCode || quote.code === toCode;
                  const takaValue = rateInBdt(quote.unitsPerUsd);

                  return (
                    <tr
                      key={quote.code}
                      className={cn(
                        "transition-colors hover:bg-surface-muted/50",
                        isBdt && "bg-brand-soft/35",
                        isSelected && !isBdt && "bg-blue-soft/30",
                      )}
                    >
                      <td className="px-5 py-2.5 sm:px-6">
                        <span className="block text-[12px] font-medium text-foreground">
                          {currencyNames[quote.code] ?? quote.code}
                        </span>
                        {isBdt ? (
                          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-brand-strong">
                            Bangladeshi taka
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] font-medium text-muted">
                        {quote.code}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right font-medium tabular text-foreground sm:px-6">
                        {takaValue !== null ? bdtPerUnitFormatter(takaValue) : "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
          <p>All rates share the service&apos;s single daily update timestamp.</p>
          <div className="flex items-center gap-3">
            <SourceLink
              href={data.source.documentationUrl}
              className="text-[10px] text-muted"
            >
              About this rate source
            </SourceLink>
            <SourceLink
              href={data.source.termsUrl}
              className="text-[10px] text-muted"
            >
              Terms
            </SourceLink>
          </div>
        </div>
      </Panel>
    </div>
  );
}
