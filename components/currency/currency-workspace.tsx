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
import { useLanguage } from "@/components/language-provider";

const AMOUNT_LIMIT = 1_000_000_000_000;

const COPY = {
  en: {
    eyebrow: "US dollar → taka",
    headline: "Bangladeshi taka per US dollar",
    dailyReference: "Daily reference",
    bdt: "BDT",
    rateSentence: (rate: string) =>
      `1 US dollar equals ${rate} Bangladeshi taka at the latest daily reference update.`,
    rateUpdated: "Rate updated",
    nextUpdate: "Next expected update",
    checkedBy: "Checked by BizScope",
    baseCurrency: "Base currency",
    baseValue: "Reference currency · US dollar",
    disclaimer:
      "Third-party reference rate. Not Bangladesh Bank's official buying or selling rate.",
    sourceCredit: "Currency data from {provider}",
    converterTitle: "Currency converter",
    converterDescription:
      "Convert between currencies using the same daily reference update.",
    currencies: (count: number) => `${count} currencies`,
    amount: "Amount",
    amountHelp:
      "Enter a non-negative number. Conversions use the same daily reference update.",
    amountError:
      "Enter a valid non-negative number, up to 1 trillion, using a period for decimals.",
    from: "From",
    to: "To",
    swapAria: "Swap source and destination currencies",
    swapTitle: "Swap currencies",
    convertedAmount: "Converted amount",
    conversionSentence: (amount: string, from: string, rate: string, to: string) =>
      `${amount} ${from} at a reference rate of 1 ${from} = ${rate} ${to}.`,
    invalidConversion: "Enter a valid amount and currencies to convert.",
    converterNote:
      "Conversions use the currency service's daily reference rates. They are indicative values, not a transaction quote. The same update time applies to all rates.",
    rateTableTitle: "Reference rate table",
    rateTableDescription:
      "How much one unit of each currency is worth in Bangladeshi taka. Search by currency code or name.",
    searchLabel: "Search currency rates",
    searchPlaceholder: "Search currency or code",
    showing: (shown: number, total: number) =>
      `Showing ${shown} of ${total} currencies`,
    noMatchTitle: "No currencies match",
    noMatchDescription:
      "Try a three-letter currency code such as BDT, USD, or EUR.",
    tableAria: "Reference rate table",
    tableCaption:
      "Third-party reference rates expressed as Bangladeshi taka per one unit of each currency",
    currency: "Currency",
    code: "Code",
    takaPerUnit: "Taka per 1 unit",
    bangladeshiTaka: "Bangladeshi taka",
    footer: "All rates share the service's single daily update timestamp.",
    aboutSource: "About this rate source",
    terms: "Terms",
  },
  bn: {
    eyebrow: "মার্কিন ডলার → টাকা",
    headline: "প্রতি মার্কিন ডলারে বাংলাদেশি টাকা",
    dailyReference: "দৈনিক রেফারেন্স",
    bdt: "টাকা",
    rateSentence: (rate: string) =>
      `সর্বশেষ দৈনিক রেফারেন্স হালনাগাদ অনুযায়ী ১ মার্কিন ডলার = ${rate} বাংলাদেশি টাকা।`,
    rateUpdated: "হার হালনাগাদ",
    nextUpdate: "পরবর্তী প্রত্যাশিত হালনাগাদ",
    checkedBy: "BizScope যাচাই করেছে",
    baseCurrency: "ভিত্তি মুদ্রা",
    baseValue: "রেফারেন্স মুদ্রা · মার্কিন ডলার",
    disclaimer:
      "তৃতীয় পক্ষের রেফারেন্স হার। এটি বাংলাদেশ ব্যাংকের সরকারি ক্রয় বা বিক্রয় হার নয়।",
    sourceCredit: "মুদ্রার ডেটা {provider} থেকে",
    converterTitle: "মুদ্রা কনভার্টার",
    converterDescription:
      "একই দৈনিক রেফারেন্স হালনাগাদ ব্যবহার করে মুদ্রা রূপান্তর করুন।",
    currencies: (count: number) => `${count}টি মুদ্রা`,
    amount: "পরিমাণ",
    amountHelp:
      "শূন্য বা তার বেশি একটি সংখ্যা লিখুন। রূপান্তরে একই দৈনিক রেফারেন্স হালনাগাদ ব্যবহার হয়।",
    amountError:
      "দশমিকের জন্য দশমিক বিন্দু ব্যবহার করে শূন্য বা তার বেশি একটি বৈধ সংখ্যা লিখুন, সর্বোচ্চ ১ ট্রিলিয়ন।",
    from: "থেকে",
    to: "প্রতি",
    swapAria: "উৎস ও গন্তব্য মুদ্রা বদলান",
    swapTitle: "মুদ্রা বদলান",
    convertedAmount: "রূপান্তরিত পরিমাণ",
    conversionSentence: (amount: string, from: string, rate: string, to: string) =>
      `${amount} ${from}, রেফারেন্স হার ১ ${from} = ${rate} ${to} অনুযায়ী।`,
    invalidConversion: "রূপান্তরের জন্য একটি বৈধ পরিমাণ ও মুদ্রা নির্বাচন করুন।",
    converterNote:
      "রূপান্তরে মুদ্রা সেবার দৈনিক রেফারেন্স হার ব্যবহার হয়। এগুলো নির্দেশক মান, কোনো লেনদেনের কোট নয়। সব হারে একই হালনাগাদের সময় প্রযোজ্য।",
    rateTableTitle: "রেফারেন্স হারের টেবিল",
    rateTableDescription:
      "প্রতিটি মুদ্রার এক একক বাংলাদেশি টাকায় কত মূল্যবান। মুদ্রার কোড বা নাম দিয়ে খুঁজুন।",
    searchLabel: "মুদ্রার হার খুঁজুন",
    searchPlaceholder: "মুদ্রা বা কোড খুঁজুন",
    showing: (shown: number, total: number) =>
      `${total}টির মধ্যে ${shown}টি মুদ্রা দেখানো হচ্ছে`,
    noMatchTitle: "কোনো মুদ্রা মেলেনি",
    noMatchDescription:
      "BDT, USD বা EUR-এর মতো তিন অক্ষরের মুদ্রা কোড দিয়ে চেষ্টা করুন।",
    tableAria: "রেফারেন্স হারের টেবিল",
    tableCaption:
      "প্রতিটি মুদ্রার এক এককে বাংলাদেশি টাকা হিসেবে তৃতীয় পক্ষের রেফারেন্স হার",
    currency: "মুদ্রা",
    code: "কোড",
    takaPerUnit: "প্রতি ১ এককে টাকা",
    bangladeshiTaka: "বাংলাদেশি টাকা",
    footer: "সব হার সেবার একক দৈনিক হালনাগাদের সময় ভাগ করে।",
    aboutSource: "এই হারের উৎস সম্পর্কে",
    terms: "শর্তাবলি",
  },
};

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
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
  const language = useLanguage();
  const copy = COPY[language];
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
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <Panel className="order-2 relative self-start overflow-hidden border-brand/25">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-brand" aria-hidden="true" />
          <div className="p-5 pt-6 sm:p-6 sm:pt-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h2 className="mt-1 text-[14px] font-semibold text-foreground">
                  {copy.headline}
                </h2>
              </div>
              <CadenceBadge cadence="daily" label={copy.dailyReference} />
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[2.8rem] font-semibold leading-none tracking-[-0.055em] text-foreground tabular">
                {data.bdtRate !== null ? formatRate(data.bdtRate) : "\u2014"}
              </span>
              <span className="text-sm font-semibold text-muted">{copy.bdt}</span>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-muted">
              {copy.rateSentence(
                data.bdtRate !== null ? formatRate(data.bdtRate) : "\u2014",
              )}
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-4 text-[11px] sm:grid-cols-2">
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  {copy.rateUpdated}
                </dt>
                <dd className="mt-1 text-[12px] font-medium leading-4 text-foreground-soft">
                  {formatUtcDateTime(data.lastUpdatedUtc)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  {copy.nextUpdate}
                </dt>
                <dd className="mt-1 text-[12px] font-medium leading-4 text-foreground-soft">
                  {formatUtcDateTime(data.nextUpdateUtc)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  {copy.checkedBy}
                </dt>
                <dd className="mt-1 text-[12px] font-medium leading-4 text-foreground-soft">
                  {formatUtcDateTime(data.retrievedAt)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-[0.07em] text-subtle">
                  {copy.baseCurrency}
                </dt>
                <dd className="mt-1 text-[12px] font-medium leading-4 text-foreground-soft">
                  {copy.baseValue}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-line bg-surface-muted/60 px-5 py-3.5 sm:px-6">
            <p className="text-[11px] leading-4 text-muted">{copy.disclaimer}</p>
            <div className="mt-1.5">
              <SourceLink
                href={data.source.homepageUrl}
                className="text-[11px] text-muted"
              >
                {copy.sourceCredit.replace("{provider}", data.source.provider)}
              </SourceLink>
            </div>
          </div>
        </Panel>

        <Panel className="order-1 min-w-0">
          <PanelHeader
            title={copy.converterTitle}
            description={copy.converterDescription}
            action={
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-mono text-[11px] text-muted">
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                {copy.currencies(data.rates.length)}
              </span>
            }
          />
          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <label
                htmlFor="converter-amount"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle"
              >
                {copy.amount}
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
                  "mt-1.5 text-[11px] leading-4",
                  amountValid ? "text-subtle" : "text-danger",
                )}
                role={!amountValid ? "alert" : undefined}
              >
                {amountValid
                  ? copy.amountHelp
                  : copy.amountError}
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
              <CurrencySelect
                id="converter-from"
                label={copy.from}
                value={fromCode}
                codes={codes}
                currencyNames={currencyNames}
                onChange={setFromCode}
              />
              <button
                type="button"
                onClick={swapCurrencies}
                className="mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-label={copy.swapAria}
                title={copy.swapTitle}
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <CurrencySelect
                id="converter-to"
                label={copy.to}
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
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.convertedAmount}
              </div>
              {convertedValue !== null ? (
                <>
                  <p className="mt-2 break-words text-[1.65rem] font-semibold leading-tight tracking-[-0.035em] text-foreground tabular">
                    {convertedFormatter(convertedValue)}{" "}
                    <span className="text-sm font-semibold text-muted">{toCode}</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {copy.conversionSentence(
                      convertedFormatter(numericAmount),
                      fromCode,
                      effectiveRate !== null
                        ? effectiveRateFormatter(effectiveRate)
                        : "\u2014",
                      toCode,
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[15px] font-medium text-subtle">
                  {copy.invalidConversion}
                </p>
              )}
            </div>

            <p className="text-[11px] leading-4 text-subtle">
              {copy.converterNote}
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title={copy.rateTableTitle}
          description={copy.rateTableDescription}
          action={
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-mono text-[11px] text-muted">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {formatUtcDateTime(data.lastUpdatedUtc)}
            </span>
          }
        />
        <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative w-full max-w-xs">
            <label htmlFor="rate-search" className="sr-only">
              {copy.searchLabel}
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
              placeholder={copy.searchPlaceholder}
              className="h-8 w-full rounded-md border border-line bg-surface pl-8 pr-2.5 text-[12px] text-foreground placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <p className="text-[11px] text-subtle" aria-live="polite">
            {copy.showing(filteredRates.length, data.rates.length)}
          </p>
        </div>
        {filteredRates.length === 0 ? (
          <EmptyState
            icon={Search}
            title={copy.noMatchTitle}
            description={copy.noMatchDescription}
          />
        ) : (
          <div
            className="max-h-[460px] overflow-auto scrollbar-subtle"
            role="region"
            aria-label={copy.tableAria}
            tabIndex={0}
          >
            <table className="w-full min-w-[460px] text-left text-[13px]">
              <caption className="sr-only">{copy.tableCaption}</caption>
              <thead className="sticky top-0 z-10 bg-surface-muted">
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    {copy.currency}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {copy.code}
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    {copy.takaPerUnit}
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
                        <span className="block text-[13px] font-medium text-foreground">
                          {currencyNames[quote.code] ?? quote.code}
                        </span>
                        {isBdt ? (
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-strong">
                            {copy.bangladeshiTaka}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-muted">
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[11px] leading-4 text-subtle sm:px-6">
          <p>{copy.footer}</p>
          <div className="flex items-center gap-3">
            <SourceLink
              href={data.source.documentationUrl}
              className="text-[11px] text-muted"
            >
              {copy.aboutSource}
            </SourceLink>
            <SourceLink
              href={data.source.termsUrl}
              className="text-[11px] text-muted"
            >
              {copy.terms}
            </SourceLink>
          </div>
        </div>
      </Panel>
    </div>
  );
}
