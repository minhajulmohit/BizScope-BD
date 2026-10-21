import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  Scale,
} from "lucide-react";
import { getAnalyticsData } from "@/lib/api/world-bank";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { convertIndicatorToBdt } from "@/lib/utils/display-currency";
import type { MetricDelta } from "@/lib/api/types";
import {
  buildTradeSeries,
  latestComparableTradeYear,
  latestTradeObservation,
} from "@/lib/utils/trade";
import {
  formatBdtCompact,
  formatBdtExact,
  formatPercent,
  formatSigned,
  formatUsdCompact,
  formatUsdExact,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { getIndicatorDelta } from "@/lib/utils/metrics";
import { getLanguage } from "@/lib/i18n-server";
import type { Language } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { ErrorState } from "@/components/ui/states";
import { RetryButton } from "@/components/ui/retry-button";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { BdtConversionNotice } from "@/components/ui/bdt-conversion-notice";
import { KpiCard } from "@/components/ui/kpi-card";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { TradeCharts } from "@/components/trade/trade-charts";

export const revalidate = 1800;

const META = {
  en: {
    title: "Trade Analytics",
    description:
      "Bangladesh trade analytics using World Bank annual exports and imports of goods and services, shown in BDT with a derived trade balance for compatible periods.",
    ogTitle: "Bangladesh trade analytics",
  },
  bn: {
    title: "বাণিজ্য বিশ্লেষণ",
    description:
      "বিশ্বব্যাংকের বার্ষিক পণ্য ও সেবা রপ্তানি ও আমদানি ব্যবহার করে বাংলাদেশের বাণিজ্য বিশ্লেষণ, টাকায় এবং সামঞ্জস্যপূর্ণ সময়ের জন্য হিসাব করা বাণিজ্য ভারসাম্যসহ।",
    ogTitle: "বাংলাদেশের বাণিজ্য বিশ্লেষণ",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguage();
  const meta = META[language];

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.ogTitle,
      description: meta.description,
    },
  };
}

function formatMoneyCompact(value: number, inBdt: boolean): string {
  return inBdt ? formatBdtCompact(value) : formatUsdCompact(value);
}

function formatMoneyExact(value: number, inBdt: boolean): string {
  return inBdt ? formatBdtExact(value) : formatUsdExact(value);
}

function moneyChangeDelta(
  current: number,
  previous: number,
  previousYear: number,
  inBdt: boolean,
): MetricDelta | null {
  const difference = current - previous;
  if (!Number.isFinite(difference)) return null;

  if (difference === 0) {
    return { direction: "flat", amountLabel: inBdt ? "৳0" : "US$0", previousYear };
  }

  return {
    direction: difference > 0 ? "up" : "down",
    amountLabel: `${difference > 0 ? "+" : "\u2212"}${formatMoneyCompact(Math.abs(difference), inBdt)}`,
    previousYear,
  };
}

function ppChangeDelta(
  current: number,
  previous: number,
  previousYear: number,
  language: Language,
): MetricDelta | null {
  const difference = current - previous;
  if (!Number.isFinite(difference)) return null;

  return {
    direction: difference === 0 ? "flat" : difference > 0 ? "up" : "down",
    amountLabel: formatSigned(
      difference,
      1,
      language === "bn" ? " শতাংশ পয়েন্ট" : " pp",
    ),
    previousYear,
  };
}

const COPY = {
  en: {
    eyebrow: "Trade / Analytics",
    title: "Trade analytics",
    description:
      "Bangladesh's exports and imports of goods and services from the World Bank, compared over time in taka. A derived balance is shown only where both series share the same definition and annual period.",
    badge: "Annual World Bank data",
    latestYear: (year: string) => `Latest trade year · ${year}`,
    noticeTitle: "Goods and services, not merchandise-only trade.",
    noticeBody:
      "These World Bank series cover exports and imports of goods and services. They include services and must not be silently mixed with merchandise-only customs figures from BBS or Bangladesh Bank. The trade balance is calculated only when both World Bank series exist for the same year.",
    errorTitle: "Trade data is incomplete",
    errorBody:
      "One or both World Bank trade series could not be loaded. Exports and imports are shown only where available, and no balance is calculated from mixed definitions or periods.",
    tryAgain: "Try again",
    kpiHeading: "Latest trade indicators",
    exportsLabel: "Exports of goods & services",
    importsLabel: "Imports of goods & services",
    balanceLabel: "Trade balance · goods & services",
    coverageLabel: "Export coverage of imports",
    bdtEquivalent: "BDT equivalent",
    currentUsd: "Current US dollars",
    annual: (year: number) => `Annual · ${year}`,
    noObservation: "No observation",
    needsBoth: "Needs both series",
    sourceWdi: "World Bank WDI",
    derivedSource: "Derived · World Bank WDI",
    derivedAnnual: "Derived annual",
    balanceUnitBdt: "Exports minus imports, BDT equivalent",
    balanceUnitUsd: "Exports minus imports, current US$",
    coverageUnit: "Exports as % of imports",
    coverageExact: (percent: string) => `${percent} of import value`,
    exportsUnavailable: "Exports unavailable",
    importsUnavailable: "Imports unavailable",
    balanceUnavailable: "Balance requires matching exports and imports",
    coverageUnavailable: "Coverage requires matching trade years",
    tableTitle: "Annual trade data",
    tableDescription:
      "World Bank exports and imports of goods and services. Balance and coverage are calculated only for years where both values exist.",
    reportedYears: (count: number) => `${count} reported years`,
    noData: "No annual trade observations are available from the source.",
    tableAria: (unit: string) => `Annual trade data table in ${unit}`,
    tableCaption:
      "Annual Bangladesh exports, imports, trade balance, and export coverage from World Bank goods and services data",
    year: "Year",
    exports: (unit: string) => `Exports (${unit})`,
    imports: (unit: string) => `Imports (${unit})`,
    balance: (unit: string) => `Balance (${unit})`,
    coverage: "Export coverage",
    latestBalance: "Latest balance",
    tableNote: (unit: string) =>
      `Values are abbreviated; exact ${unit} appear on hover. Balance is calculated here, not a World Bank-published series.`,
    takaEquivalents: "taka equivalents",
    usdValues: "US-dollar values",
    retrieved: (date: string) => `Retrieved ${date}`,
    bdtUnit: "BDT equivalents",
    usdUnit: "US dollars",
    definitionsTitle: "Definitions & comparability",
    definitionsDescription: "What the chart does — and does not — measure.",
    exportsTerm: "Exports",
    importsTerm: "Imports",
    exportsBody:
      "are the value of goods and services provided to the rest of the world.",
    importsBody: "are the value received from the rest of the world.",
    currencyBody:
      "Both include services. The World Bank reports them in US dollars; the dashboard shows taka equivalents at the current reference rate.",
    balanceBodyStart:
      "The balance is exports minus imports for the same year. A negative balance is a deficit. It is not the same as the trade contribution to GDP.",
    nominalBody:
      "Because values are nominal, changes reflect price movements as well as volume. The same current exchange rate is used for every year, so the taka series is a present-day equivalent, not a historical exchange-rate conversion. It is not adjusted for inflation.",
    exportsIndicator: "Exports indicator",
    importsIndicator: "Imports indicator",
    methodology: "Source methodology",
    officialTitle: "Official Bangladesh sources",
    officialDescription:
      "Linked for context; not automatically combined with the charts above.",
    officialBody:
      "BBS foreign trade statistics and Bangladesh Bank balance-of-payments data may use customs, merchandise, or BOP definitions that differ from the World Bank goods-and-services series. They are deliberately not merged into these values.",
    updateSentence: (date: string) =>
      `The latest World Bank data update was ${date}. These are annual official statistics, not a live trade ticker.`,
    bbsLink: "BBS foreign trade statistics",
    bbLink: "Bangladesh Bank National Summary Data Page",
  },
  bn: {
    eyebrow: "বাণিজ্য / বিশ্লেষণ",
    title: "বাণিজ্য বিশ্লেষণ",
    description:
      "বিশ্বব্যাংক থেকে বাংলাদেশের পণ্য ও সেবা রপ্তানি ও আমদানি, সময়ের সঙ্গে টাকায় তুলনা করা। কেবল একই সংজ্ঞা ও বার্ষিক সময়কালের দুটি সিরিজ থাকলে একটি হিসাব করা ভারসাম্য দেখানো হয়।",
    badge: "বার্ষিক বিশ্বব্যাংক ডেটা",
    latestYear: (year: string) => `সর্বশেষ বাণিজ্য বছর · ${year}`,
    noticeTitle: "পণ্য ও সেবা, শুধু পণ্যের বাণিজ্য নয়।",
    noticeBody:
      "বিশ্বব্যাংকের এই সিরিজগুলো পণ্য ও সেবার রপ্তানি ও আমদানি কভার করে। এতে সেবা অন্তর্ভুক্ত এবং BBS বা বাংলাদেশ ব্যাংকের শুধু পণ্যের কাস্টমস সংখ্যার সঙ্গে নিঃশব্দে মেশানো যাবে না। একই বছরের দুটি বিশ্বব্যাংক সিরিজ থাকলেই কেবল বাণিজ্য ভারসাম্য হিসাব করা হয়।",
    errorTitle: "বাণিজ্য ডেটা অসম্পূর্ণ",
    errorBody:
      "বিশ্বব্যাংকের বাণিজ্য সিরিজের একটি বা দুটোই লোড করা যায়নি। রপ্তানি ও আমদানি কেবল যেখানে পাওয়া গেছে সেখানে দেখানো হচ্ছে, এবং মেশানো সংজ্ঞা বা সময়কাল থেকে কোনো ভারসাম্য হিসাব করা হয় না।",
    tryAgain: "আবার চেষ্টা করুন",
    kpiHeading: "সর্বশেষ বাণিজ্য সূচক",
    exportsLabel: "পণ্য ও সেবা রপ্তানি",
    importsLabel: "পণ্য ও সেবা আমদানি",
    balanceLabel: "বাণিজ্য ভারসাম্য · পণ্য ও সেবা",
    coverageLabel: "আমদানির তুলনায় রপ্তানির কভারেজ",
    bdtEquivalent: "টাকার সমতুল্য",
    currentUsd: "চলতি মার্কিন ডলার",
    annual: (year: number) => `বার্ষিক · ${year}`,
    noObservation: "কোনো পর্যবেক্ষণ নেই",
    needsBoth: "দুটো সিরিজই দরকার",
    sourceWdi: "World Bank WDI",
    derivedSource: "হিসাব করা · World Bank WDI",
    derivedAnnual: "হিসাব করা বার্ষিক",
    balanceUnitBdt: "রপ্তানি থেকে আমদানি বাদ, টাকার সমতুল্য",
    balanceUnitUsd: "রপ্তানি থেকে আমদানি বাদ, চলতি মার্কিন ডলার",
    coverageUnit: "আমদানির শতাংশ হিসেবে রপ্তানি",
    coverageExact: (percent: string) => `আমদানি মূল্যের ${percent}`,
    exportsUnavailable: "রপ্তানি পাওয়া যাচ্ছে না",
    importsUnavailable: "আমদানি পাওয়া যাচ্ছে না",
    balanceUnavailable: "ভারসাম্যের জন্য মিলে যাওয়া রপ্তানি ও আমদানি দরকার",
    coverageUnavailable: "কভারেজের জন্য মিলে যাওয়া বাণিজ্য বছর দরকার",
    tableTitle: "বার্ষিক বাণিজ্য ডেটা",
    tableDescription:
      "বিশ্বব্যাংকের পণ্য ও সেবা রপ্তানি ও আমদানি। কেবল যে বছরগুলোতে দুটো মানই আছে সেখানে ভারসাম্য ও কভারেজ হিসাব করা হয়।",
    reportedYears: (count: number) => `${count}টি রিপোর্ট করা বছর`,
    noData: "উৎস থেকে কোনো বার্ষিক বাণিজ্য পর্যবেক্ষণ পাওয়া যাচ্ছে না।",
    tableAria: (unit: string) => `${unit}-এ বার্ষিক বাণিজ্য ডেটা টেবিল`,
    tableCaption:
      "বিশ্বব্যাংকের পণ্য ও সেবা ডেটা থেকে বাংলাদেশের বার্ষিক রপ্তানি, আমদানি, বাণিজ্য ভারসাম্য ও রপ্তানি কভারেজ",
    year: "বছর",
    exports: (unit: string) => `রপ্তানি (${unit})`,
    imports: (unit: string) => `আমদানি (${unit})`,
    balance: (unit: string) => `ভারসাম্য (${unit})`,
    coverage: "রপ্তানি কভারেজ",
    latestBalance: "সর্বশেষ ভারসাম্য",
    tableNote: (unit: string) =>
      `মানগুলো সংক্ষিপ্ত করা; হোভারে সঠিক ${unit} দেখা যায়। ভারসাম্য এখানে হিসাব করা, বিশ্বব্যাংক-প্রকাশিত সিরিজ নয়।`,
    takaEquivalents: "টাকার সমতুল্য",
    usdValues: "মার্কিন ডলারের মান",
    retrieved: (date: string) => `সংগৃহীত ${date}`,
    bdtUnit: "টাকার সমতুল্য",
    usdUnit: "মার্কিন ডলার",
    definitionsTitle: "সংজ্ঞা ও তুলনাযোগ্যতা",
    definitionsDescription: "চার্ট কী মাপে—আর কী মাপে না।",
    exportsTerm: "রপ্তানি",
    importsTerm: "আমদানি",
    exportsBody:
      "হলো বিশ্বের বাকি অংশকে সরবরাহ করা পণ্য ও সেবার মূল্য।",
    importsBody: "হলো বিশ্বের বাকি অংশ থেকে পাওয়া মান।",
    currencyBody:
      "দুটোতেই সেবা অন্তর্ভুক্ত। বিশ্বব্যাংক এগুলো মার্কিন ডলারে প্রকাশ করে; ড্যাশবোর্ড চলতি রেফারেন্স হারে টাকার সমতুল্য দেখায়।",
    balanceBodyStart:
      "ভারসাম্য হলো একই বছরের রপ্তানি থেকে আমদানি বাদ। নেতিবাচক ভারসাম্য মানে ঘাটতি। এটি জিডিপিতে বাণিজ্যের অবদানের সমান নয়।",
    nominalBody:
      "মানগুলো নামমাত্র, তাই পরিবর্তনে পরিমাণের পাশাপাশি দামের গতিও প্রতিফলিত হয়। প্রতিটি বছরের জন্য একই চলতি বিনিময় হার ব্যবহার করা হয়, তাই টাকার সিরিজ আজকের সমতুল্য—ঐতিহাসিক বিনিময় হারের রূপান্তর নয়। এতে মূল্যস্ফীতির সমন্বয় নেই।",
    exportsIndicator: "রপ্তানি সূচক",
    importsIndicator: "আমদানি সূচক",
    methodology: "উৎসের পদ্ধতি",
    officialTitle: "বাংলাদেশের সরকারি উৎস",
    officialDescription:
      "প্রেক্ষাপটের জন্য লিংক করা; উপরের চার্টের সঙ্গে স্বয়ংক্রিয়ভাবে মেশানো হয় না।",
    officialBody:
      "BBS-এর বৈদেশিক বাণিজ্য পরিসংখ্যান এবং বাংলাদেশ ব্যাংকের লেনদেন ভারসাম্য (BOP) ডেটায় কাস্টমস, শুধু পণ্য বা BOP সংজ্ঞা থাকতে পারে, যা বিশ্বব্যাংকের পণ্য ও সেবা সিরিজ থেকে আলাদা। সেগুলো ইচ্ছাকৃতভাবে এই মানের সঙ্গে মেশানো হয় না।",
    updateSentence: (date: string) =>
      `বিশ্বব্যাংকের সর্বশেষ ডেটা হালনাগাদ ছিল ${date}। এগুলো বার্ষিক সরকারি পরিসংখ্যান, লাইভ বাণিজ্য টিকার নয়।`,
    bbsLink: "BBS বৈদেশিক বাণিজ্য পরিসংখ্যান",
    bbLink: "বাংলাদেশ ব্যাংক জাতীয় সারসংক্ষেপ ডেটা পেজ",
  },
};

export default async function TradePage() {
  const language = await getLanguage();
  const copy = COPY[language];
  const [analytics, currency] = await Promise.all([
    getAnalyticsData(),
    getCurrencyData(),
  ]);
  const displaysInBdt = currency.bdtRate !== null;
  const exportsIndicator = analytics.indicators.exports
    ? convertIndicatorToBdt(analytics.indicators.exports, currency.bdtRate ?? 0)
    : null;
  const importsIndicator = analytics.indicators.imports
    ? convertIndicatorToBdt(analytics.indicators.imports, currency.bdtRate ?? 0)
    : null;

  const series = buildTradeSeries(exportsIndicator, importsIndicator);
  const latestExports = latestTradeObservation(series, "exports");
  const latestImports = latestTradeObservation(series, "imports");
  const latestBalance = latestComparableTradeYear(series);
  const previousBalance =
    latestBalance && series.find(
      (row) => row.year === latestBalance.year - 1 && row.balance !== null,
    );
  const previousCoverage =
    latestBalance && series.find(
      (row) => row.year === latestBalance.year - 1 && row.coverageRatio !== null,
    );

  const sourceUrl =
    exportsIndicator?.source.sourceUrl ??
    importsIndicator?.source.sourceUrl ??
    "https://data.worldbank.org/indicator/NE.EXP.GNFS.CD?locations=BD";
  const providerUpdated =
    exportsIndicator?.source.datasetUpdated ??
    importsIndicator?.source.datasetUpdated ??
    null;
  const lastRetrieved =
    exportsIndicator?.source.retrievedAt ??
    importsIndicator?.source.retrievedAt ??
    null;
  const tradeYears = series.filter(
    (row) => row.exports !== null || row.imports !== null,
  ).length;
  const balanceReady = latestBalance?.balance !== null && latestBalance?.balance !== undefined;

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="periodic" label={copy.badge} />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            {copy.latestYear(
              String(latestExports?.year ?? latestImports?.year ?? "\u2014"),
            )}
          </span>
        </div>
      </PageHeader>

      <DataNotice title={copy.noticeTitle}>
        {copy.noticeBody}
      </DataNotice>

      <BdtConversionNotice
        bdtPerUsd={currency.bdtRate}
        updatedAt={currency.lastUpdatedUtc}
        language={language}
      />

      {!exportsIndicator || !importsIndicator ? (
        <ErrorState
          title={copy.errorTitle}
          description={copy.errorBody}
          action={<RetryButton label={copy.tryAgain} />}
        />
      ) : null}

      <section aria-labelledby="trade-kpis-heading">
        <h2 id="trade-kpis-heading" className="sr-only">
          {copy.kpiHeading}
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={copy.exportsLabel}
            value={
              latestExports?.exports !== undefined && latestExports?.exports !== null
                ? formatMoneyCompact(latestExports.exports, displaysInBdt)
                : null
            }
            exactValue={
              latestExports?.exports != null
                ? formatMoneyExact(latestExports.exports, displaysInBdt)
                : undefined
            }
            unit={displaysInBdt ? copy.bdtEquivalent : copy.currentUsd}
            period={
              latestExports
                ? copy.annual(latestExports.year)
                : copy.noObservation
            }
            sourceName={copy.sourceWdi}
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel={copy.badge}
            providerUpdatedAt={providerUpdated}
            delta={
              exportsIndicator ? getIndicatorDelta(exportsIndicator, language) : null
            }
            icon={ArrowUpRight}
            tone="brand"
            unavailableMessage={copy.exportsUnavailable}
            language={language}
          />
          <KpiCard
            label={copy.importsLabel}
            value={
              latestImports?.imports !== undefined && latestImports?.imports !== null
                ? formatMoneyCompact(latestImports.imports, displaysInBdt)
                : null
            }
            exactValue={
              latestImports?.imports != null
                ? formatMoneyExact(latestImports.imports, displaysInBdt)
                : undefined
            }
            unit={displaysInBdt ? copy.bdtEquivalent : copy.currentUsd}
            period={
              latestImports
                ? copy.annual(latestImports.year)
                : copy.noObservation
            }
            sourceName={copy.sourceWdi}
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel={copy.badge}
            providerUpdatedAt={providerUpdated}
            delta={
              importsIndicator ? getIndicatorDelta(importsIndicator, language) : null
            }
            icon={ArrowDownRight}
            tone="blue"
            unavailableMessage={copy.importsUnavailable}
            language={language}
          />
          <KpiCard
            label={copy.balanceLabel}
            value={
              balanceReady && latestBalance?.balance != null
                ? formatMoneyCompact(latestBalance.balance, displaysInBdt)
                : null
            }
            exactValue={
              latestBalance?.balance != null
                ? formatMoneyExact(latestBalance.balance, displaysInBdt)
                : undefined
            }
            unit={
              displaysInBdt ? copy.balanceUnitBdt : copy.balanceUnitUsd
            }
            period={
              latestBalance
                ? copy.annual(latestBalance.year)
                : copy.needsBoth
            }
            sourceName={copy.derivedSource}
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel={copy.derivedAnnual}
            providerUpdatedAt={providerUpdated}
            delta={
              latestBalance?.balance != null &&
              previousBalance?.balance != null &&
              latestBalance.year - previousBalance.year === 1
                ? moneyChangeDelta(
                    latestBalance.balance,
                    previousBalance.balance,
                    previousBalance.year,
                    displaysInBdt,
                  )
                : null
            }
            icon={Scale}
            tone="amber"
            unavailableMessage={copy.balanceUnavailable}
            language={language}
          />
          <KpiCard
            label={copy.coverageLabel}
            value={
              latestBalance?.coverageRatio != null
                ? formatPercent(latestBalance.coverageRatio, 1)
                : null
            }
            exactValue={
              latestBalance?.coverageRatio != null
                ? copy.coverageExact(
                    formatPercent(latestBalance.coverageRatio, 2),
                  )
                : undefined
            }
            unit={copy.coverageUnit}
            period={
              latestBalance
                ? copy.annual(latestBalance.year)
                : copy.needsBoth
            }
            sourceName={copy.derivedSource}
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel={copy.derivedAnnual}
            providerUpdatedAt={providerUpdated}
            delta={
              latestBalance?.coverageRatio != null &&
              previousCoverage?.coverageRatio != null &&
              latestBalance.year - previousCoverage.year === 1
                ? ppChangeDelta(
                    latestBalance.coverageRatio,
                    previousCoverage.coverageRatio,
                    previousCoverage.year,
                    language,
                  )
                : null
            }
            icon={Percent}
            tone="neutral"
            unavailableMessage={copy.coverageUnavailable}
            language={language}
          />
        </div>
      </section>

      <TradeCharts
        series={series}
        providerUpdated={providerUpdated}
        bdtPerUsd={currency.bdtRate}
        bdtUpdatedAt={currency.lastUpdatedUtc}
      />

      <Panel>
        <PanelHeader
          title={copy.tableTitle}
          description={copy.tableDescription}
          action={
            <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
              {copy.reportedYears(tradeYears)}
            </span>
          }
        />
        {series.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12px] text-muted sm:px-6">
            {copy.noData}
          </div>
        ) : (
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label={copy.tableAria(
              displaysInBdt ? copy.bdtUnit : copy.usdUnit,
            )}
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <caption className="sr-only">{copy.tableCaption}</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[10px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    {copy.year}
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    {copy.exports(displaysInBdt ? "৳" : "US$")}
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    {copy.imports(displaysInBdt ? "৳" : "US$")}
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    {copy.balance(displaysInBdt ? "৳" : "US$")}
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    {copy.coverage}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {series.map((row) => (
                  <tr key={row.year} className="transition-colors hover:bg-surface-muted/40">
                    <th scope="row" className="px-5 py-2.5 font-medium text-foreground sm:px-6">
                      <span className="inline-flex items-center gap-2">
                        {row.year}
                        {latestBalance?.year === row.year ? (
                          <span className="rounded bg-brand-soft px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-brand-strong">
                            {copy.latestBalance}
                          </span>
                        ) : null}
                      </span>
                    </th>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right tabular text-foreground"
                      title={row.exports !== null ? formatMoneyExact(row.exports, displaysInBdt) : undefined}
                    >
                      {row.exports !== null ? formatMoneyCompact(row.exports, displaysInBdt) : "\u2014"}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right tabular text-foreground"
                      title={row.imports !== null ? formatMoneyExact(row.imports, displaysInBdt) : undefined}
                    >
                      {row.imports !== null ? formatMoneyCompact(row.imports, displaysInBdt) : "\u2014"}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular text-foreground"
                      title={row.balance !== null ? formatMoneyExact(row.balance, displaysInBdt) : undefined}
                    >
                      {row.balance !== null ? formatMoneyCompact(row.balance, displaysInBdt) : "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right tabular text-muted sm:px-6">
                      {row.coverageRatio !== null
                        ? formatPercent(row.coverageRatio, 1)
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
          <p>
            {copy.tableNote(
              displaysInBdt ? copy.takaEquivalents : copy.usdValues,
            )}
          </p>
          <p>{copy.retrieved(formatUtcDateTime(lastRetrieved))}</p>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title={copy.definitionsTitle}
            description={copy.definitionsDescription}
          />
          <div className="space-y-3 p-5 text-[12px] leading-6 text-muted sm:p-6">
            <p>
              <span className="font-semibold text-foreground">
                {copy.exportsTerm}
              </span>{" "}
              {copy.exportsBody}{" "}
              <span className="font-semibold text-foreground">
                {copy.importsTerm}
              </span>{" "}
              {copy.importsBody} {copy.currencyBody}
            </p>
            <p>{copy.balanceBodyStart}</p>
            <p>{copy.nominalBody}</p>
            <div className="flex flex-wrap gap-4 pt-1">
              <SourceLink href={sourceUrl} className="text-[11px]">
                {copy.exportsIndicator}
              </SourceLink>
              <SourceLink
                href="https://data.worldbank.org/indicator/NE.IMP.GNFS.CD?locations=BD"
                className="text-[11px]"
              >
                {copy.importsIndicator}
              </SourceLink>
              <Link
                href="/sources"
                className="text-[11px] font-medium text-muted underline decoration-line-strong underline-offset-2 hover:text-foreground"
              >
                {copy.methodology}
              </Link>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title={copy.officialTitle}
            description={copy.officialDescription}
          />
          <div className="space-y-3 p-5 text-[12px] leading-6 text-muted sm:p-6">
            <p>{copy.officialBody}</p>
            <p>{copy.updateSentence(formatUtcDate(providerUpdated))}</p>
            <div className="flex flex-col gap-2 pt-1">
              <SourceLink
                href="https://bbs.gov.bd/site/page/58b1c0c8-34b9-45b5-954d-53a2737e7bb1"
                className="text-[11px]"
              >
                {copy.bbsLink}
              </SourceLink>
              <SourceLink
                href="https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php"
                className="text-[11px]"
              >
                {copy.bbLink}
              </SourceLink>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
