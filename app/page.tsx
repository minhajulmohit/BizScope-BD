import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
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
import { convertAnalyticsToBdt } from "@/lib/utils/display-currency";
import { cn } from "@/lib/utils/cn";
import { DataNotice } from "@/components/ui/data-notice";
import { DataNotesDisclosure } from "@/components/ui/data-notes-disclosure";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorState } from "@/components/ui/states";
import { KpiCard } from "@/components/ui/kpi-card";
import { RetryButton } from "@/components/ui/retry-button";
import { LatestObservations } from "@/components/overview/latest-observations";
import { OverviewChartSwitcher } from "@/components/overview/overview-chart-switcher";
import { SourceSummary } from "@/components/overview/source-summary";

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
  { icon: LucideIcon }
> = {
  gdp: { icon: Landmark },
  gdpGrowth: { icon: TrendingUp },
  inflation: { icon: CirclePercent },
  unemployment: { icon: BriefcaseBusiness },
  population: { icon: UsersRound },
};

const PRIMARY_OVERVIEW_KEYS: IndicatorKey[] = [
  "gdp",
  "inflation",
  "unemployment",
];

const SECONDARY_OVERVIEW_KEYS: IndicatorKey[] = ["gdpGrowth", "population"];

const COPY = {
  en: {
    heroEyebrow: "Bangladesh data dashboard",
    heroTitle: "Bangladesh at a glance.",
    heroDescription:
      "The latest GDP, inflation, unemployment, and dollar rate — with the year and source behind every number.",
    economyLink: "Explore the economy",
    currencyLink: "Convert dollar rates",
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
    keyEyebrow: "Key numbers",
    keyTitle: "Latest official readings",
    keyDescription: "Four headline readings, each with its year and source.",
    moreIndicators: "More indicators",
    moreIndicatorsDescription: "GDP growth and total population",
    allEconomicData: "All economy data",
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
    trendsTitle: "How the numbers are moving",
    trendsDescription:
      "Switch between growth and inflation, or trade flows. Reported years only; gaps are not filled.",
    tradeDetail: "Trade details",
    exploreByMetric: "Explore indicators",
    evidenceEyebrow: "Details",
    evidenceTitle: "Data table & sources",
    evidenceDescription:
      "Open the full observation table and source list when you need to check a number.",
    footer:
      "Figures are shown as published by their sources and are not investment advice. World Bank and OpenDataBD data are subject to their respective licences; the currency reference comes from a third party. See",
    sourcesLink: "Sources & Methodology",
    footerEnd: "for cadence, limitations, and licensing.",
  },
  bn: {
    heroEyebrow: "বাংলাদেশ ডেটা ড্যাশবোর্ড",
    heroTitle: "এক নজরে বাংলাদেশ।",
    heroDescription:
      "সর্বশেষ জিডিপি, মূল্যস্ফীতি, বেকারত্ব ও ডলার রেট—প্রতিটি সংখ্যার সঙ্গে বছর ও উৎসসহ।",
    economyLink: "অর্থনীতি দেখুন",
    currencyLink: "ডলার রেট বদলান",
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
    keyEyebrow: "মূল সংখ্যা",
    keyTitle: "সর্বশেষ সরকারি মান",
    keyDescription: "চারটি প্রধান সংখ্যা, প্রতিটির বছর ও উৎসসহ।",
    moreIndicators: "আরও সূচক",
    moreIndicatorsDescription: "জিডিপি প্রবৃদ্ধি ও মোট জনসংখ্যা",
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
    trendsTitle: "সংখ্যাগুলো কীভাবে বদলাচ্ছে",
    trendsDescription:
      "প্রবৃদ্ধি ও মূল্যস্ফীতি, অথবা বাণিজ্য প্রবাহ দেখুন। কেবল রিপোর্ট করা বছর; ফাঁক পূরণ করা হয় না।",
    tradeDetail: "বাণিজ্যের বিস্তারিত",
    exploreByMetric: "সূচক দেখুন",
    evidenceEyebrow: "বিস্তারিত",
    evidenceTitle: "ডেটা টেবিল ও উৎস",
    evidenceDescription:
      "কোনো সংখ্যা যাচাই করতে চাইলে পূর্ণ পর্যবেক্ষণ টেবিল ও উৎসের তালিকা খুলুন।",
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
      className="inline-flex items-center gap-1 rounded-md text-[12px] font-semibold text-brand-strong underline decoration-brand/30 underline-offset-4 transition-colors hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2
          id={id}
          className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.4rem]"
        >
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-muted sm:text-[14px]">
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

  const renderIndicatorCard = (key: IndicatorKey) => {
    const definition = INDICATOR_DEFINITIONS[key];
    const definitionCopy = language === "bn" ? definition.bn : definition;
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
        providerUpdatedAt={indicator?.source.datasetUpdated ?? null}
        icon={config.icon}
        unavailableMessage={copy.noValidObservation}
        language={language}
      />
    );
  };

  return (
    <div className="space-y-8 sm:space-y-9">
      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-7 lg:p-8">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.05em] text-foreground sm:text-[2.75rem]">
          {copy.heroTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
          {copy.heroDescription}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/economy"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-[14px] font-semibold text-brand-contrast transition-colors hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {copy.economyLink}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/currency"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-line bg-surface px-4 text-[14px] font-semibold text-foreground-soft transition-colors hover:border-line-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {copy.currencyLink}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-[13px] leading-5 text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-subtle" aria-hidden="true" />
            {copy.latestObservation}:{" "}
            <strong className="font-semibold text-foreground-soft">
              {analytics.summary.latestObservationYear ?? "\u2014"}
            </strong>
          </span>
          <span>
            {copy.worldBankUpdate}: {formatUtcDate(analytics.summary.lastProviderUpdate)}
          </span>
          <span>
            {copy.lastChecked}:{" "}
            {formatUtcDateTime(analytics.summary.lastSuccessfulRetrieval)}
          </span>
        </div>
      </section>

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
          id="key-indicators-heading"
          eyebrow={copy.keyEyebrow}
          title={copy.keyTitle}
          description={copy.keyDescription}
          action={<HeroLink href="/economy">{copy.allEconomicData}</HeroLink>}
        />
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {PRIMARY_OVERVIEW_KEYS.map(renderIndicatorCard)}

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
            providerUpdatedAt={currency.lastUpdatedUtc}
            icon={CircleDollarSign}
            tone="blue"
            unavailableMessage={copy.currencyUnavailable}
            language={language}
          />
        </div>

        <Disclosure
          className="mt-4"
          summary={copy.moreIndicators}
          description={copy.moreIndicatorsDescription}
        >
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {SECONDARY_OVERVIEW_KEYS.map(renderIndicatorCard)}
          </div>
        </Disclosure>

        <div className="mt-4">
          <DataNotesDisclosure
            annualTitle={copy.noticeTitle}
            annualBody={copy.noticeBody}
            bdtPerUsd={currency.bdtRate}
            updatedAt={currency.lastUpdatedUtc}
            language={language}
          />
        </div>
      </section>

      <section aria-labelledby="trends-heading">
        <SectionHeading
          id="trends-heading"
          eyebrow={copy.trendsEyebrow}
          title={copy.trendsTitle}
          description={copy.trendsDescription}
          action={<HeroLink href="/economy">{copy.exploreByMetric}</HeroLink>}
        />
        <div className="mt-4">
          <OverviewChartSwitcher
            analytics={displayAnalytics}
            inBdt={displaysInBdt}
          />
        </div>
      </section>

      <Disclosure
        summary={copy.evidenceTitle}
        description={copy.evidenceDescription}
      >
        <div className="grid gap-4 xl:grid-cols-3">
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
      </Disclosure>

      <p className={cn("max-w-3xl text-[11px] leading-4 text-subtle")}>
        {copy.footer}{" "}
        <Link href="/sources" className="font-medium text-muted underline underline-offset-2 hover:text-foreground">
          {copy.sourcesLink}
        </Link>{" "}
        {copy.footerEnd}
      </p>
    </div>
  );
}
