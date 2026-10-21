import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  CirclePercent,
  Landmark,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAnalyticsData } from "@/lib/api/world-bank";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { getOpenDataBdStats } from "@/lib/api/opendatabd";
import type { AnalyticsData, IndicatorKey } from "@/lib/api/types";
import {
  INDICATOR_DEFINITIONS,
  INDICATOR_ORDER,
  localizeIndicator,
  OVERVIEW_INDICATOR_KEYS,
} from "@/lib/indicator-catalog";
import { getLanguage } from "@/lib/i18n-server";
import {
  formatIndicatorExact,
  formatIndicatorValue,
  formatObservationPeriod,
  formatRate,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { getIndicatorDelta } from "@/lib/utils/metrics";
import { convertAnalyticsToBdt } from "@/lib/utils/display-currency";
import { cn } from "@/lib/utils/cn";
import { DataNotice } from "@/components/ui/data-notice";
import { BdtConversionNotice } from "@/components/ui/bdt-conversion-notice";
import { ErrorState } from "@/components/ui/states";
import { KpiCard } from "@/components/ui/kpi-card";
import { RetryButton } from "@/components/ui/retry-button";
import { LatestObservations } from "@/components/overview/latest-observations";
import { SourceSummary } from "@/components/overview/source-summary";
import {
  EconomicPerformanceChart,
  GdpGrowthTrendChart,
  InflationTrendChart,
  TradeFlowsChart,
} from "@/components/charts/overview-charts";

export const revalidate = 1800;

const META = {
  en: {
    title: "Overview",
    description:
      "A Bangladesh business intelligence overview: GDP, growth, inflation, unemployment, population, trade, and the dollar–taka reference rate, with observation years and sources attached.",
    ogTitle: "BizScope BD \u2014 Bangladesh at a glance",
  },
  bn: {
    title: "ওভারভিউ",
    description:
      "বাংলাদেশের ব্যবসায়িক অন্তর্দৃষ্টির ওভারভিউ: জিডিপি, প্রবৃদ্ধি, মূল্যস্ফীতি, বেকারত্ব, জনসংখ্যা, বাণিজ্য এবং ডলার–টাকার রেফারেন্স হার—পর্যবেক্ষণ বছর ও উৎসসহ।",
    ogTitle: "BizScope BD \u2014 এক নজরে বাংলাদেশ",
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

const KPI_CONFIG: Record<
  "gdp" | "gdpGrowth" | "inflation" | "unemployment" | "population",
  { icon: LucideIcon; tone: "brand" | "blue" | "amber" | "neutral" }
> = {
  gdp: { icon: Landmark, tone: "brand" },
  gdpGrowth: { icon: TrendingUp, tone: "brand" },
  inflation: { icon: CirclePercent, tone: "amber" },
  unemployment: { icon: BriefcaseBusiness, tone: "blue" },
  population: { icon: UsersRound, tone: "neutral" },
};

const COPY = {
  en: {
    heroEyebrow: "See Bangladesh Through Data",
    heroTitle: "Bangladesh at a glance.",
    heroDescription:
      "A clear read on the country's economy, trade, currency, and public data. Every figure carries its unit, observation year, and source — including the periods when the data is not current.",
    economyLink: "Economic analytics",
    tradeLink: "Trade analytics",
    currencyLink: "Currency & rates",
    latestObservation: "Latest observation",
    latestObservationNote: "World Bank annual statistics · not a live estimate",
    worldBankUpdate: "World Bank update",
    worldBankUpdateNote: "The date the World Bank last revised this data",
    lastChecked: "Last checked by BizScope",
    lastCheckedNote: "Server time, UTC",
    noticeTitle: "Official annual statistics, not live estimates.",
    noticeBody:
      "World Bank indicators are annual official statistics and may be revised; the latest available year can lag today. The dollar–taka figure is a daily reference rate from ExchangeRate-API, not Bangladesh Bank's official buying or selling rate.",
    indicatorsErrorTitle: "Some indicators could not be loaded",
    indicatorsErrorBody: (scopes: string) =>
      `Showing only successfully loaded series${scopes ? `. Unavailable: ${scopes}` : ""}. No values are inserted for missing data.`,
    tryAgain: "Try again",
    currencyErrorTitle: "The daily currency reference is currently unavailable.",
    currencyErrorBody:
      "Other dashboard sections remain usable. The currency card and converter will show an unavailable state instead of a stale or invented rate.",
    keyEyebrow: "Key indicators",
    keyTitle: "The latest official readings",
    keyDescription:
      "Five annual World Bank series plus one independent daily currency reference. Observation periods are shown on every card.",
    allEconomicData: "All economic data",
    noUsableObservation: "No usable observation",
    worldBankSource: "World Bank WDI",
    worldBankCadence: "Annual",
    noValidObservation: "No valid observation returned",
    dollarTaka: "Dollar to taka reference rate",
    dollarTakaExact: "1 US dollar = ৳{rate} (third-party reference)",
    takaPerDollar: "Taka per US dollar",
    dailyReference: "Daily ref. · {date}",
    updateUnavailable: "Update time unavailable",
    dailyThirdParty: "Daily · third party",
    currencySource: "ExchangeRate-API",
    currencyUnavailable: "Daily reference rate unavailable",
    trendsEyebrow: "Trends",
    trendsTitle: "Economic performance over time",
    trendsDescription:
      "Annual observations from the World Bank. Charts show reported data only; missing periods are left blank rather than estimated.",
    tradeDetail: "Trade detail",
    exploreByMetric: "Explore by metric",
    evidenceEyebrow: "Evidence",
    evidenceTitle: "Latest observations & sources",
    evidenceDescription:
      "The values behind the dashboard, with observation years, source dates, and an honest status for each source.",
    footer:
      "Figures are shown as published by their sources and are not investment advice. World Bank and OpenDataBD data are subject to their respective licences; the currency reference comes from a third party. See",
    sourcesLink: "Sources & Methodology",
    footerEnd: "for cadence, limitations, and licensing.",
  },
  bn: {
    heroEyebrow: "ডেটার মাধ্যমে বাংলাদেশকে দেখুন",
    heroTitle: "এক নজরে বাংলাদেশ।",
    heroDescription:
      "দেশের অর্থনীতি, বাণিজ্য, মুদ্রা ও সর্বজনীন ডেটা সম্পর্কে স্পষ্ট ধারণা। প্রতিটি সংখ্যার সঙ্গে একক, পর্যবেক্ষণের বছর ও উৎস দেওয়া আছে—যে সময়ের তথ্য হালনাগাদ নয়, সেটিও স্পষ্ট করা হয়।",
    economyLink: "অর্থনৈতিক বিশ্লেষণ",
    tradeLink: "বাণিজ্য বিশ্লেষণ",
    currencyLink: "মুদ্রা ও বিনিময় হার",
    latestObservation: "সর্বশেষ পর্যবেক্ষণ",
    latestObservationNote: "বিশ্বব্যাংকের বার্ষিক পরিসংখ্যান · চলতি সময়ের অনুমান নয়",
    worldBankUpdate: "বিশ্বব্যাংকের হালনাগাদ",
    worldBankUpdateNote: "বিশ্বব্যাংক সর্বশেষ কবে এই ডেটা সংশোধন করেছে",
    lastChecked: "BizScope সর্বশেষ যাচাই করেছে",
    lastCheckedNote: "সার্ভারের সময়, UTC",
    noticeTitle: "সরকারি বার্ষিক পরিসংখ্যান, চলতি সময়ের অনুমান নয়।",
    noticeBody:
      "বিশ্বব্যাংকের সূচকগুলো বার্ষিক সরকারি পরিসংখ্যান এবং সংশোধিত হতে পারে; সর্বশেষ পাওয়া বছর আজকের চেয়ে পিছিয়ে থাকতে পারে। ডলার–টাকার মান ExchangeRate-API-এর দৈনিক রেফারেন্স—বাংলাদেশ ব্যাংকের সরকারি ক্রয় বা বিক্রয় হার নয়।",
    indicatorsErrorTitle: "কিছু সূচক লোড করা যায়নি",
    indicatorsErrorBody: (scopes: string) =>
      `শুধু সফলভাবে লোড হওয়া সিরিজ দেখানো হচ্ছে${scopes ? `। অনুপলব্ধ: ${scopes}` : ""}। অনুপস্থিত ডেটার জন্য কোনো মান বসানো হয়নি।`,
    tryAgain: "আবার চেষ্টা করুন",
    currencyErrorTitle: "দৈনিক মুদ্রা রেফারেন্স এখন পাওয়া যাচ্ছে না।",
    currencyErrorBody:
      "ড্যাশবোর্ডের বাকি অংশ ব্যবহারযোগ্য থাকবে। পুরোনো বা বানানো হার দেখানোর বদলে মুদ্রার কার্ড ও কনভার্টার অনুপলব্ধ অবস্থা দেখাবে।",
    keyEyebrow: "মূল সূচক",
    keyTitle: "সর্বশেষ সরকারি মান",
    keyDescription:
      "পাঁচটি বার্ষিক বিশ্বব্যাংক সিরিজ এবং একটি স্বাধীন দৈনিক মুদ্রা রেফারেন্স। প্রতিটি কার্ডে পর্যবেক্ষণের সময় দেখানো আছে।",
    allEconomicData: "সব অর্থনৈতিক ডেটা",
    noUsableObservation: "ব্যবহারযোগ্য পর্যবেক্ষণ নেই",
    worldBankSource: "World Bank WDI",
    worldBankCadence: "বার্ষিক",
    noValidObservation: "কোনো বৈধ পর্যবেক্ষণ পাওয়া যায়নি",
    dollarTaka: "ডলার থেকে টাকার রেফারেন্স হার",
    dollarTakaExact: "১ মার্কিন ডলার = ৳{rate} (তৃতীয় পক্ষের রেফারেন্স)",
    takaPerDollar: "প্রতি মার্কিন ডলারে টাকা",
    dailyReference: "দৈনিক রেফারেন্স · {date}",
    updateUnavailable: "হালনাগাদের সময় পাওয়া যাচ্ছে না",
    dailyThirdParty: "দৈনিক · তৃতীয় পক্ষ",
    currencySource: "ExchangeRate-API",
    currencyUnavailable: "দৈনিক রেফারেন্স হার পাওয়া যাচ্ছে না",
    trendsEyebrow: "প্রবণতা",
    trendsTitle: "সময়ের সঙ্গে অর্থনৈতিক পারফরম্যান্স",
    trendsDescription:
      "বিশ্বব্যাংকের বার্ষিক পর্যবেক্ষণ। চার্ট কেবল রিপোর্ট করা ডেটা দেখায়; অনুপস্থিত সময় অনুমান করে পূরণ না করে খালি রাখা হয়।",
    tradeDetail: "বাণিজ্যের বিস্তারিত",
    exploreByMetric: "সূচক অনুযায়ী দেখুন",
    evidenceEyebrow: "প্রমাণ",
    evidenceTitle: "সর্বশেষ পর্যবেক্ষণ ও উৎস",
    evidenceDescription:
      "ড্যাশবোর্ডের পেছনের মান, পর্যবেক্ষণের বছর, উৎসের তারিখ এবং প্রতিটি উৎসের সৎ অবস্থা।",
    footer:
      "সংখ্যাগুলো তাদের উৎসে প্রকাশিত হিসেবে দেখানো হয় এবং এটি বিনিয়োগ পরামর্শ নয়। বিশ্বব্যাংক ও OpenDataBD ডেটা নিজ নিজ লাইসেন্সের অধীন; মুদ্রা রেফারেন্স একটি তৃতীয় পক্ষ থেকে আসে। দেখুন",
    sourcesLink: "উৎস ও পদ্ধতি",
    footerEnd: "—হালনাগাদের ধরন, সীমাবদ্ধতা ও লাইসেন্সের জন্য।",
  },
};

function HeroLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.4rem]">
          {title}
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-muted sm:text-[13px]">
          {description}
        </p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-4">{action}</div> : null}
    </div>
  );
}

export default async function OverviewPage() {
  const language = await getLanguage();
  const copy = COPY[language];
  const [analytics, currency, datasetStats] = await Promise.all([
    getAnalyticsData(),
    getCurrencyData(),
    getOpenDataBdStats().catch(() => null),
  ]);

  const indicatorKeys = OVERVIEW_INDICATOR_KEYS;
  const scopeNames = analytics.errors
    .map((error) => {
      const key = INDICATOR_ORDER.find(
        (candidate) => INDICATOR_DEFINITIONS[candidate].shortName === error.scope,
      );
      if (!key) return error.scope;
      return language === "bn"
        ? INDICATOR_DEFINITIONS[key].bn.shortName
        : INDICATOR_DEFINITIONS[key].shortName;
    })
    .join(", ");
  const convertedAnalytics = convertAnalyticsToBdt(analytics, currency.bdtRate);
  const localizedIndicators = Object.fromEntries(
    INDICATOR_ORDER.map((key) => {
      const indicator = convertedAnalytics.indicators[key];
      return [key, indicator ? localizeIndicator(indicator, language) : null];
    }),
  ) as AnalyticsData["indicators"];
  const displayAnalytics: AnalyticsData = {
    ...convertedAnalytics,
    indicators: localizedIndicators,
  };
  const displaysInBdt = currency.bdtRate !== null && currency.bdtRate > 0;

  return (
    <div className="space-y-8 sm:space-y-9">
      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-7 lg:p-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow">{copy.heroEyebrow}</p>
            <h1 className="mt-2 max-w-2xl text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.05em] text-foreground sm:text-[2.65rem]">
              {copy.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
              {copy.heroDescription}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <HeroLink href="/economy">{copy.economyLink}</HeroLink>
              <HeroLink href="/trade">{copy.tradeLink}</HeroLink>
              <HeroLink href="/currency">{copy.currencyLink}</HeroLink>
            </div>
          </div>

          <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-background">
            <div className="p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {copy.latestObservation}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground tabular">
                {analytics.summary.latestObservationYear ?? "\u2014"}
              </dd>
              <dd className="mt-0.5 text-[10px] leading-4 text-muted">
                {copy.latestObservationNote}
              </dd>
            </div>
            <div className="p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {copy.worldBankUpdate}
              </dt>
              <dd className="mt-1 text-[12px] font-medium leading-5 text-foreground-soft">
                {formatUtcDate(analytics.summary.lastProviderUpdate)}
              </dd>
              <dd className="mt-0.5 text-[10px] leading-4 text-muted">
                {copy.worldBankUpdateNote}
              </dd>
            </div>
            <div className="p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {copy.lastChecked}
              </dt>
              <dd className="mt-1 text-[12px] font-medium leading-5 text-foreground-soft">
                {formatUtcDateTime(analytics.summary.lastSuccessfulRetrieval)}
              </dd>
              <dd className="mt-0.5 text-[10px] leading-4 text-muted">
                {copy.lastCheckedNote}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <DataNotice title={copy.noticeTitle}>
        {copy.noticeBody}
      </DataNotice>

      <BdtConversionNotice
        bdtPerUsd={currency.bdtRate}
        updatedAt={currency.lastUpdatedUtc}
        language={language}
      />

      {analytics.errors.length > 0 ? (
        <ErrorState
          title={copy.indicatorsErrorTitle}
          description={copy.indicatorsErrorBody(scopeNames)}
          action={<RetryButton label={copy.tryAgain} />}
        />
      ) : null}

      {currency.status === "error" ? (
        <DataNotice
          tone="warning"
          title={copy.currencyErrorTitle}
        >
          {copy.currencyErrorBody}
        </DataNotice>
      ) : null}

      <section aria-labelledby="key-indicators-heading">
        <SectionHeading
          eyebrow={copy.keyEyebrow}
          title={copy.keyTitle}
          description={copy.keyDescription}
          action={<HeroLink href="/economy">{copy.allEconomicData}</HeroLink>}
        />
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {indicatorKeys.map((key: IndicatorKey) => {
            const definition = INDICATOR_DEFINITIONS[key];
            const definitionCopy =
              language === "bn" ? definition.bn : definition;
            const indicator = displayAnalytics.indicators[key];
            const config = KPI_CONFIG[key as keyof typeof KPI_CONFIG];
            const latest = indicator?.latest ?? null;

            return (
              <KpiCard
                key={key}
                label={definitionCopy.shortName}
                value={
                  latest && indicator
                    ? formatIndicatorValue(indicator, latest.value)
                    : null
                }
                exactValue={
                  latest && indicator
                    ? formatIndicatorExact(indicator.unit, latest.value, language)
                    : undefined
                }
                unit={indicator?.unitLabel ?? definitionCopy.unitLabel}
                period={
                  latest
                    ? formatObservationPeriod(latest.year, language)
                    : copy.noUsableObservation
                }
                sourceName={copy.worldBankSource}
                sourceUrl={
                  indicator?.source.sourceUrl ??
                  `https://data.worldbank.org/indicator/${definition.code}?locations=BD`
                }
                cadence="periodic"
                cadenceLabel={copy.worldBankCadence}
                providerUpdatedAt={indicator?.source.datasetUpdated ?? null}
                delta={indicator ? getIndicatorDelta(indicator, language) : null}
                icon={config.icon}
                tone={config.tone}
                unavailableMessage={copy.noValidObservation}
                language={language}
              />
            );
          })}

          <KpiCard
            label={copy.dollarTaka}
            value={
              currency.bdtRate !== null ? formatRate(currency.bdtRate) : null
            }
            exactValue={
              currency.bdtRate !== null
                ? copy.dollarTakaExact.replace(
                    "{rate}",
                    formatRate(currency.bdtRate),
                  )
                : undefined
            }
            unit={copy.takaPerDollar}
            period={
              currency.lastUpdatedUtc
                ? copy.dailyReference.replace(
                    "{date}",
                    formatUtcDate(currency.lastUpdatedUtc),
                  )
                : copy.updateUnavailable
            }
            sourceName={copy.currencySource}
            sourceUrl={currency.source.documentationUrl}
            cadence="daily"
            cadenceLabel={copy.dailyThirdParty}
            providerUpdatedAt={currency.lastUpdatedUtc}
            delta={null}
            icon={CircleDollarSign}
            tone="blue"
            unavailableMessage={copy.currencyUnavailable}
            language={language}
          />
        </div>
      </section>

      <section aria-labelledby="trends-heading">
        <SectionHeading
          eyebrow={copy.trendsEyebrow}
          title={copy.trendsTitle}
          description={copy.trendsDescription}
          action={
            <>
              <HeroLink href="/trade">{copy.tradeDetail}</HeroLink>
              <HeroLink href="/economy">{copy.exploreByMetric}</HeroLink>
            </>
          }
        />
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <EconomicPerformanceChart analytics={displayAnalytics} />
          </div>
          <div className="min-w-0">
            <TradeFlowsChart analytics={displayAnalytics} inBdt={displaysInBdt} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <GdpGrowthTrendChart indicator={displayAnalytics.indicators.gdpGrowth} />
          <InflationTrendChart indicator={displayAnalytics.indicators.inflation} />
        </div>
      </section>

      <section aria-labelledby="evidence-heading">
        <SectionHeading
          eyebrow={copy.evidenceEyebrow}
          title={copy.evidenceTitle}
          description={copy.evidenceDescription}
        />
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <LatestObservations
              analytics={displayAnalytics}
              inBdt={displaysInBdt}
              language={language}
            />
          </div>
          <div className="min-w-0">
            <SourceSummary
              analytics={analytics}
              currency={currency}
              datasetStats={datasetStats}
              language={language}
            />
          </div>
        </div>
      </section>

      <p className={cn("max-w-3xl text-[10px] leading-4 text-subtle")}>
        {copy.footer}{" "}
        <Link href="/sources" className="font-medium text-muted underline underline-offset-2 hover:text-foreground">
          {copy.sourcesLink}
        </Link>{" "}
        {copy.footerEnd}
      </p>
    </div>
  );
}
