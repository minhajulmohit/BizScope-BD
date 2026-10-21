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
import type { IndicatorKey } from "@/lib/api/types";
import {
  INDICATOR_DEFINITIONS,
  OVERVIEW_INDICATOR_KEYS,
} from "@/lib/indicator-catalog";
import {
  formatIndicatorExact,
  formatIndicatorValue,
  formatObservationPeriod,
  formatRate,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { getIndicatorDelta } from "@/lib/utils/metrics";
import { cn } from "@/lib/utils/cn";
import { DataNotice } from "@/components/ui/data-notice";
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

const PAGE_DESCRIPTION =
  "A Bangladesh business intelligence overview: GDP, growth, inflation, unemployment, population, trade, and the USD/BDT reference rate, with observation years and sources attached.";

export const metadata: Metadata = {
  title: "Overview",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "BizScope BD \u2014 Bangladesh at a glance",
    description: PAGE_DESCRIPTION,
  },
};

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
  const [analytics, currency, datasetStats] = await Promise.all([
    getAnalyticsData(),
    getCurrencyData(),
    getOpenDataBdStats().catch(() => null),
  ]);

  const indicatorKeys = OVERVIEW_INDICATOR_KEYS;
  const scopeNames = analytics.errors.map((error) => error.scope).join(", ");

  return (
    <div className="space-y-8 sm:space-y-9">
      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-7 lg:p-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow">See Bangladesh Through Data</p>
            <h1 className="mt-2 max-w-2xl text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.05em] text-foreground sm:text-[2.65rem]">
              Bangladesh at a glance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
              A clear read on the country&apos;s economy, trade, currency, and
              public data. Every figure carries its unit, observation year, and
              source — including the periods when the data is not current.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <HeroLink href="/economy">Economic analytics</HeroLink>
              <HeroLink href="/trade">Trade analytics</HeroLink>
              <HeroLink href="/currency">Currency &amp; rates</HeroLink>
            </div>
          </div>

          <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-background">
            <div className="p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Latest observation
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground tabular">
                {analytics.summary.latestObservationYear ?? "\u2014"}
              </dd>
              <dd className="mt-0.5 text-[10px] leading-4 text-muted">
                World Bank annual statistics · not a live estimate
              </dd>
            </div>
            <div className="p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Provider update
              </dt>
              <dd className="mt-1 text-[12px] font-medium leading-5 text-foreground-soft">
                {formatUtcDate(analytics.summary.lastProviderUpdate)}
              </dd>
              <dd className="mt-0.5 text-[10px] leading-4 text-muted">
                World Bank API <code>lastupdated</code>
              </dd>
            </div>
            <div className="p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Last successful retrieval
              </dt>
              <dd className="mt-1 text-[12px] font-medium leading-5 text-foreground-soft">
                {formatUtcDateTime(analytics.summary.lastSuccessfulRetrieval)}
              </dd>
              <dd className="mt-0.5 text-[10px] leading-4 text-muted">
                Cached server response · UTC
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <DataNotice title="Periodic statistics, not a real-time feed.">
        World Bank indicators are annual official statistics and may be revised;
        the latest available year can lag today. The USD/BDT figure is a daily
        third-party reference rate from Open ER-API, not Bangladesh Bank&apos;s
        official buying or selling rate.
      </DataNotice>

      {analytics.errors.length > 0 ? (
        <ErrorState
          title="Some indicators could not be loaded"
          description={`Showing only successfully loaded series${
            scopeNames ? `. Unavailable: ${scopeNames}` : ""
          }. No values are inserted for missing data.`}
          action={<RetryButton label="Retry data request" />}
        />
      ) : null}

      {currency.status === "error" ? (
        <DataNotice
          tone="warning"
          title="The daily currency reference feed is currently unavailable."
        >
          Other dashboard sections remain usable. The currency card and converter
          will show an unavailable state instead of a stale or invented rate.
        </DataNotice>
      ) : null}

      <section aria-labelledby="key-indicators-heading">
        <SectionHeading
          eyebrow="Key indicators"
          title="The latest official readings"
          description="Five annual World Bank series plus one independent daily FX reference. Observation periods are shown on every card."
          action={<HeroLink href="/economy">All economic data</HeroLink>}
        />
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {indicatorKeys.map((key: IndicatorKey) => {
            const definition = INDICATOR_DEFINITIONS[key];
            const indicator = analytics.indicators[key];
            const config = KPI_CONFIG[key as keyof typeof KPI_CONFIG];
            const latest = indicator?.latest ?? null;

            return (
              <KpiCard
                key={key}
                label={definition.shortName}
                value={
                  latest && indicator
                    ? formatIndicatorValue(indicator, latest.value)
                    : null
                }
                exactValue={
                  latest ? formatIndicatorExact(definition.unit, latest.value) : undefined
                }
                unit={definition.unitLabel}
                period={
                  latest
                    ? formatObservationPeriod(latest.year)
                    : "No usable observation"
                }
                sourceName="World Bank WDI"
                sourceUrl={
                  indicator?.source.sourceUrl ??
                  `https://data.worldbank.org/indicator/${definition.code}?locations=BD`
                }
                cadence="periodic"
                cadenceLabel="Annual"
                providerUpdatedAt={indicator?.source.datasetUpdated ?? null}
                delta={indicator ? getIndicatorDelta(indicator) : null}
                icon={config.icon}
                tone={config.tone}
                unavailableMessage="No valid observation returned"
              />
            );
          })}

          <KpiCard
            label="USD to BDT reference rate"
            value={
              currency.bdtRate !== null ? formatRate(currency.bdtRate) : null
            }
            exactValue={
              currency.bdtRate !== null
                ? `1 USD = ${formatRate(currency.bdtRate)} BDT (third-party reference)`
                : undefined
            }
            unit="BDT per 1 USD"
            period={
              currency.lastUpdatedUtc
                ? `Daily ref. · ${formatUtcDate(currency.lastUpdatedUtc)}`
                : "Update time unavailable"
            }
            sourceName="Open ER-API"
            sourceUrl={currency.source.documentationUrl}
            cadence="daily"
            cadenceLabel="Daily · third party"
            providerUpdatedAt={currency.lastUpdatedUtc}
            delta={null}
            icon={CircleDollarSign}
            tone="blue"
            unavailableMessage="Reference feed unavailable"
          />
        </div>
      </section>

      <section aria-labelledby="trends-heading">
        <SectionHeading
          eyebrow="Trends"
          title="Economic performance over time"
          description="Annual observations from the World Bank. Charts show reported data only; missing periods are left blank rather than estimated."
          action={
            <>
              <HeroLink href="/trade">Trade detail</HeroLink>
              <HeroLink href="/economy">Explore by metric</HeroLink>
            </>
          }
        />
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <EconomicPerformanceChart analytics={analytics} />
          </div>
          <div className="min-w-0">
            <TradeFlowsChart analytics={analytics} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <GdpGrowthTrendChart indicator={analytics.indicators.gdpGrowth} />
          <InflationTrendChart indicator={analytics.indicators.inflation} />
        </div>
      </section>

      <section aria-labelledby="evidence-heading">
        <SectionHeading
          eyebrow="Evidence"
          title="Latest observations & sources"
          description="The values behind the dashboard, with observation years, provider freshness, and honest integration status."
        />
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <LatestObservations analytics={analytics} />
          </div>
          <div className="min-w-0">
            <SourceSummary
              analytics={analytics}
              currency={currency}
              datasetStats={datasetStats}
            />
          </div>
        </div>
      </section>

      <p className={cn("max-w-3xl text-[10px] leading-4 text-subtle")}>
        Figures are shown as published by their providers and are not investment
        advice. World Bank and OpenDataBD data are subject to their respective
        licences; Open ER-API is a third-party reference feed. See{" "}
        <Link href="/sources" className="font-medium text-muted underline underline-offset-2 hover:text-foreground">
          Sources &amp; Methodology
        </Link>{" "}
        for cadence, limitations, and licensing.
      </p>
    </div>
  );
}
