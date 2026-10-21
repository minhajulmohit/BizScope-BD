import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  Scale,
} from "lucide-react";
import { getAnalyticsData } from "@/lib/api/world-bank";
import type { MetricDelta } from "@/lib/api/types";
import {
  buildTradeSeries,
  latestComparableTradeYear,
  latestTradeObservation,
} from "@/lib/utils/trade";
import {
  formatPercent,
  formatSigned,
  formatUsdCompact,
  formatUsdExact,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { getIndicatorDelta } from "@/lib/utils/metrics";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { ErrorState } from "@/components/ui/states";
import { RetryButton } from "@/components/ui/retry-button";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { KpiCard } from "@/components/ui/kpi-card";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { TradeCharts } from "@/components/trade/trade-charts";

export const revalidate = 1800;

const PAGE_DESCRIPTION =
  "Bangladesh trade analytics using World Bank annual exports and imports of goods and services, with a derived trade balance shown only for compatible periods.";

export const metadata: Metadata = {
  title: "Trade Analytics",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "Bangladesh trade analytics",
    description: PAGE_DESCRIPTION,
  },
};

function usdChangeDelta(
  current: number,
  previous: number,
  previousYear: number,
): MetricDelta | null {
  const difference = current - previous;
  if (!Number.isFinite(difference)) return null;

  if (difference === 0) {
    return { direction: "flat", amountLabel: "US$0", previousYear };
  }

  return {
    direction: difference > 0 ? "up" : "down",
    amountLabel: `${difference > 0 ? "+" : "\u2212"}${formatUsdCompact(Math.abs(difference))}`,
    previousYear,
  };
}

function ppChangeDelta(
  current: number,
  previous: number,
  previousYear: number,
): MetricDelta | null {
  const difference = current - previous;
  if (!Number.isFinite(difference)) return null;

  return {
    direction: difference === 0 ? "flat" : difference > 0 ? "up" : "down",
    amountLabel: formatSigned(difference, 1, " pp"),
    previousYear,
  };
}

export default async function TradePage() {
  const analytics = await getAnalyticsData();
  const exportsIndicator = analytics.indicators.exports;
  const importsIndicator = analytics.indicators.imports;

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
        eyebrow="Trade / Analytics"
        title="Trade analytics"
        description="Bangladesh's exports and imports of goods and services from the World Bank, compared over time with a derived balance shown only where both series share the same definition and annual period."
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="periodic" label="Annual World Bank data" />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            Latest trade year · {latestExports?.year ?? latestImports?.year ?? "\u2014"}
          </span>
        </div>
      </PageHeader>

      <DataNotice title="Goods and services, not merchandise-only trade.">
        These World Bank series cover exports and imports of goods and services in
        current US dollars. They include services and must not be silently mixed
        with merchandise-only customs figures from BBS or Bangladesh Bank. The
        trade balance is calculated only when both World Bank series exist for the
        same year.
      </DataNotice>

      {!exportsIndicator || !importsIndicator ? (
        <ErrorState
          title="Trade data is incomplete"
          description="One or both World Bank trade series could not be loaded. Exports and imports are shown only where available, and no balance is calculated from mixed definitions or periods."
          action={<RetryButton label="Retry trade data" />}
        />
      ) : null}

      <section aria-labelledby="trade-kpis-heading">
        <h2 id="trade-kpis-heading" className="sr-only">
          Latest trade indicators
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Exports of goods & services"
            value={
              latestExports?.exports !== undefined && latestExports?.exports !== null
                ? formatUsdCompact(latestExports.exports)
                : null
            }
            exactValue={
              latestExports?.exports != null
                ? formatUsdExact(latestExports.exports)
                : undefined
            }
            unit="Current US dollars"
            period={
              latestExports ? `Annual · ${latestExports.year}` : "No observation"
            }
            sourceName="World Bank WDI"
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel="Annual"
            providerUpdatedAt={providerUpdated}
            delta={exportsIndicator ? getIndicatorDelta(exportsIndicator) : null}
            icon={ArrowUpRight}
            tone="brand"
            unavailableMessage="Exports unavailable"
          />
          <KpiCard
            label="Imports of goods & services"
            value={
              latestImports?.imports !== undefined && latestImports?.imports !== null
                ? formatUsdCompact(latestImports.imports)
                : null
            }
            exactValue={
              latestImports?.imports != null
                ? formatUsdExact(latestImports.imports)
                : undefined
            }
            unit="Current US dollars"
            period={
              latestImports ? `Annual · ${latestImports.year}` : "No observation"
            }
            sourceName="World Bank WDI"
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel="Annual"
            providerUpdatedAt={providerUpdated}
            delta={importsIndicator ? getIndicatorDelta(importsIndicator) : null}
            icon={ArrowDownRight}
            tone="blue"
            unavailableMessage="Imports unavailable"
          />
          <KpiCard
            label="Trade balance · goods & services"
            value={
              balanceReady && latestBalance?.balance != null
                ? formatUsdCompact(latestBalance.balance)
                : null
            }
            exactValue={
              latestBalance?.balance != null
                ? formatUsdExact(latestBalance.balance)
                : undefined
            }
            unit="Exports minus imports, current US$"
            period={
              latestBalance ? `Annual · ${latestBalance.year}` : "Needs both series"
            }
            sourceName="Derived · World Bank WDI"
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel="Derived annual"
            providerUpdatedAt={providerUpdated}
            delta={
              latestBalance?.balance != null &&
              previousBalance?.balance != null &&
              latestBalance.year - previousBalance.year === 1
                ? usdChangeDelta(
                    latestBalance.balance,
                    previousBalance.balance,
                    previousBalance.year,
                  )
                : null
            }
            icon={Scale}
            tone="amber"
            unavailableMessage="Balance requires matching exports and imports"
          />
          <KpiCard
            label="Export coverage of imports"
            value={
              latestBalance?.coverageRatio != null
                ? formatPercent(latestBalance.coverageRatio, 1)
                : null
            }
            exactValue={
              latestBalance?.coverageRatio != null
                ? `${formatPercent(latestBalance.coverageRatio, 2)} of import value`
                : undefined
            }
            unit="Exports as % of imports"
            period={
              latestBalance ? `Annual · ${latestBalance.year}` : "Needs both series"
            }
            sourceName="Derived · World Bank WDI"
            sourceUrl={sourceUrl}
            cadence="periodic"
            cadenceLabel="Derived annual"
            providerUpdatedAt={providerUpdated}
            delta={
              latestBalance?.coverageRatio != null &&
              previousCoverage?.coverageRatio != null &&
              latestBalance.year - previousCoverage.year === 1
                ? ppChangeDelta(
                    latestBalance.coverageRatio,
                    previousCoverage.coverageRatio,
                    previousCoverage.year,
                  )
                : null
            }
            icon={Percent}
            tone="neutral"
            unavailableMessage="Coverage requires matching trade years"
          />
        </div>
      </section>

      <TradeCharts series={series} providerUpdated={providerUpdated} />

      <Panel>
        <PanelHeader
          title="Annual trade data"
          description="World Bank exports and imports of goods and services. Balance and coverage are calculated only for years where both values exist."
          action={
            <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
              {tradeYears} reported years
            </span>
          }
        />
        {series.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12px] text-muted sm:px-6">
            No annual trade observations are available from the source.
          </div>
        ) : (
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label="Annual trade data table"
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <caption className="sr-only">
                Annual Bangladesh exports, imports, trade balance, and export
                coverage from World Bank goods and services data
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[10px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Year
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Exports
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Imports
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Balance
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    Export coverage
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
                            Latest balance
                          </span>
                        ) : null}
                      </span>
                    </th>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right tabular text-foreground"
                      title={row.exports !== null ? formatUsdExact(row.exports) : undefined}
                    >
                      {row.exports !== null ? formatUsdCompact(row.exports) : "\u2014"}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right tabular text-foreground"
                      title={row.imports !== null ? formatUsdExact(row.imports) : undefined}
                    >
                      {row.imports !== null ? formatUsdCompact(row.imports) : "\u2014"}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular text-foreground"
                      title={row.balance !== null ? formatUsdExact(row.balance) : undefined}
                    >
                      {row.balance !== null ? formatUsdCompact(row.balance) : "\u2014"}
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
            Values abbreviated on screen; exact source values appear on hover.
            Balance is a derived calculation, not a World Bank-published series.
          </p>
          <p>Retrieved {formatUtcDateTime(lastRetrieved)}</p>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Definitions & comparability"
            description="What the chart does — and does not — measure."
          />
          <div className="space-y-3 p-5 text-[12px] leading-6 text-muted sm:p-6">
            <p>
              <span className="font-semibold text-foreground">Exports</span> are the
              value of goods and services provided to the rest of the world.{" "}
              <span className="font-semibold text-foreground">Imports</span> are the
              value received from the rest of the world. Both are in current US
              dollars and include services.
            </p>
            <p>
              The balance is <span className="font-semibold text-foreground">exports minus imports</span>{" "}
              for the same year. A negative balance is a deficit. It is not the same
              as the trade contribution to GDP.
            </p>
            <p>
              Because values are nominal, changes reflect price movements and
              exchange-rate effects as well as volume. This dashboard does not
              adjust these series for inflation.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <SourceLink href={sourceUrl} className="text-[11px]">
                Exports indicator
              </SourceLink>
              <SourceLink
                href="https://data.worldbank.org/indicator/NE.IMP.GNFS.CD?locations=BD"
                className="text-[11px]"
              >
                Imports indicator
              </SourceLink>
              <Link
                href="/sources"
                className="text-[11px] font-medium text-muted underline decoration-line-strong underline-offset-2 hover:text-foreground"
              >
                Source methodology
              </Link>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Official Bangladesh sources"
            description="Linked for context; not automatically combined with the charts above."
          />
          <div className="space-y-3 p-5 text-[12px] leading-6 text-muted sm:p-6">
            <p>
              BBS foreign trade statistics and Bangladesh Bank balance-of-payments
              data may use customs, merchandise, or BOP definitions that differ from
              the World Bank goods-and-services series. They are deliberately not
              merged into these values.
            </p>
            <p>
              The latest World Bank provider update was{" "}
              <span className="font-medium text-foreground">
                {formatUtcDate(providerUpdated)}
              </span>
              . These are periodic official statistics, not a live trade ticker.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <SourceLink
                href="https://bbs.gov.bd/site/page/58b1c0c8-34b9-45b5-954d-53a2737e7bb1"
                className="text-[11px]"
              >
                BBS foreign trade statistics
              </SourceLink>
              <SourceLink
                href="https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php"
                className="text-[11px]"
              >
                Bangladesh Bank National Summary Data Page
              </SourceLink>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
