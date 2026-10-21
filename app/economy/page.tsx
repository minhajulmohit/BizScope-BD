import type { Metadata } from "next";
import Link from "next/link";
import { getAnalyticsData } from "@/lib/api/world-bank";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { convertAnalyticsToBdt } from "@/lib/utils/display-currency";
import { PageHeader } from "@/components/ui/page-header";
import { BdtConversionNotice } from "@/components/ui/bdt-conversion-notice";
import { DataNotice } from "@/components/ui/data-notice";
import { ErrorState } from "@/components/ui/states";
import { RetryButton } from "@/components/ui/retry-button";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { EconomyExplorer } from "@/components/economy/economy-explorer";

export const revalidate = 1800;

const PAGE_DESCRIPTION =
  "Explore Bangladesh GDP, annual growth, consumer price inflation, unemployment, and population with selected-year charts, data tables, definitions, and observation dates.";

export const metadata: Metadata = {
  title: "Economic Analytics",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "Bangladesh economic analytics",
    description: PAGE_DESCRIPTION,
  },
};

export default async function EconomyPage() {
  const [analytics, currency] = await Promise.all([
    getAnalyticsData(),
    getCurrencyData(),
  ]);
  const displayAnalytics = convertAnalyticsToBdt(analytics, currency.bdtRate);

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow="Economy / Analytics"
        title="Economic analytics"
        description="A ten-observation view of Bangladesh's national accounts, prices, labor market, and population. Select a metric, narrow the annual range, and inspect the values behind the chart."
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="periodic" label="Annual World Bank data" />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            Latest observation · {analytics.summary.latestObservationYear ?? "\u2014"}
          </span>
        </div>
      </PageHeader>

      <DataNotice title="Annual official statistics, subject to revision.">
        The World Bank publishes new observations once a year and can revise past
        years. Charts and tables use reported years only; missing observations
        are not extrapolated or filled.{" "}
        <Link
          href="/sources"
          className="font-medium text-foreground-soft underline underline-offset-2 hover:text-foreground"
        >
          Read the methodology
        </Link>
        .
      </DataNotice>

      <BdtConversionNotice
        bdtPerUsd={currency.bdtRate}
        updatedAt={currency.lastUpdatedUtc}
      />

      {analytics.status !== "ok" ? (
        <ErrorState
          title={
            analytics.status === "error"
              ? "Economic data is currently unavailable"
              : "Some economic indicators are unavailable"
          }
          description={
            analytics.status === "error"
              ? "We couldn't load the World Bank data. No placeholder values are shown. Check your connection or try again."
              : `${analytics.summary.availableIndicators} of ${analytics.summary.totalIndicators} indicators loaded. Only those series are shown.`
          }
          action={<RetryButton label="Try again" />}
        />
      ) : null}

      <EconomyExplorer analytics={displayAnalytics} />
    </div>
  );
}
