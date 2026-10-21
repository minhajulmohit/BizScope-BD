"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TradeYear } from "@/lib/utils/trade";
import {
  formatAxisBdt,
  formatAxisUsd,
  formatBdtExact,
  formatRate,
  formatUsdExact,
  formatUtcDate,
} from "@/lib/utils/format";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip, chartTooltipWrapperStyle } from "@/components/charts/chart-tooltip";
import { ChartEmpty } from "@/components/charts/chart-empty";

const MARGIN = { top: 10, right: 10, left: -2, bottom: 0 };
const AXIS_TICK = { fill: "var(--chart-axis)", fontSize: 10 } as const;

function ChartSourceFooter({
  providerUpdated,
  note,
}: {
  providerUpdated: string | null;
  note: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
      <p>{note}</p>
      <p>
        <SourceLink
          href="https://data.worldbank.org/country/bangladesh"
          className="text-muted"
        >
          World Bank WDI
        </SourceLink>
        {providerUpdated
          ? ` · source updated ${formatUtcDate(providerUpdated)}`
          : null}
      </p>
    </div>
  );
}

export function TradeCharts({
  series,
  providerUpdated,
  bdtPerUsd,
  bdtUpdatedAt,
}: {
  series: TradeYear[];
  providerUpdated: string | null;
  bdtPerUsd: number | null;
  bdtUpdatedAt: string | null;
}) {
  const inBdt = bdtPerUsd !== null && bdtPerUsd > 0;
  const hasFlows = series.some(
    (row) => row.exports !== null || row.imports !== null,
  );
  const comparable = series.filter((row) => row.balance !== null);
  const hasBalance = comparable.length > 0;
  const axisFormatter = inBdt ? formatAxisBdt : formatAxisUsd;
  const formatExact = inBdt ? formatBdtExact : formatUsdExact;
  const conversionNote =
    inBdt && bdtPerUsd !== null
      ? `Taka equivalents at 1 USD = ৳${formatRate(bdtPerUsd)}${
          bdtUpdatedAt ? ` (${formatUtcDate(bdtUpdatedAt)})` : ""
        }.`
      : "Shown in the source currency because the taka reference rate is unavailable.";

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel className="flex min-w-0 flex-col xl:col-span-2">
        <PanelHeader
          title="Exports vs imports over time"
          description={`Goods and services. ${conversionNote}`}
          action={
            <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
              {series.length} annual periods
            </span>
          }
        />
        {!hasFlows ? (
          <ChartEmpty description="No World Bank trade observations are available." />
        ) : (
          <>
            <div className="px-5 pt-4 sm:px-6">
              <ChartLegend
                items={[
                  { label: "Exports of goods & services", color: "var(--chart-emerald)", shape: "bar" },
                  { label: "Imports of goods & services", color: "var(--chart-blue)", shape: "bar" },
                ]}
              />
            </div>
            <div
              className="h-[320px] w-full px-2 pb-2 pt-4 sm:h-[350px] sm:px-3"
              role="group"
              aria-label={`Grouped bar chart of annual Bangladesh exports and imports of goods and services${inBdt ? " in BDT equivalents" : " in US dollars"}.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={MARGIN} barGap={2}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={16}
                  />
                  <YAxis
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={axisFormatter}
                  />
                  <Tooltip
                    wrapperStyle={chartTooltipWrapperStyle}
                    cursor={{ fill: "var(--chart-cursor)" }}
                    content={
                      <ChartTooltip
                        formatLabel={(label) => `Annual trade flows · ${String(label ?? "")}`}
                        formatValue={(value) => formatExact(value)}
                      />
                    }
                  />
                  <Bar
                    dataKey="exports"
                    name="Exports of goods & services"
                    fill="var(--chart-emerald)"
                    radius={[3, 3, 0, 0]}
                    barSize={13}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="imports"
                    name="Imports of goods & services"
                    fill="var(--chart-blue)"
                    radius={[3, 3, 0, 0]}
                    barSize={13}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto">
              <ChartSourceFooter
                providerUpdated={providerUpdated}
                note="Goods and services only — not merchandise-only customs trade."
              />
            </div>
          </>
        )}
      </Panel>

      <Panel className="flex min-w-0 flex-col">
        <PanelHeader
          title="Trade balance"
          description={`Exports minus imports, same definition and period. ${conversionNote}`}
          action={
            hasBalance ? (
              <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
                {comparable.length} comparable years
              </span>
            ) : null
          }
        />
        {!hasBalance ? (
          <ChartEmpty
            title="Balance cannot be calculated"
            description="A trade balance requires both the exports and imports series for the same annual period. This dashboard does not substitute another trade definition."
          />
        ) : (
          <>
            <div className="px-5 pt-4 sm:px-6">
              <ChartLegend
                items={[
                  { label: "Surplus", color: "var(--chart-emerald)", shape: "bar" },
                  { label: "Deficit", color: "var(--chart-blue)", shape: "bar" },
                ]}
              />
            </div>
            <div
              className="h-[320px] w-full px-2 pb-2 pt-4 sm:h-[350px] sm:px-3"
              role="group"
              aria-label={`Diverging bar chart of Bangladesh's annual goods and services trade balance${inBdt ? " in BDT equivalents" : " in US dollars"}.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={MARGIN}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={16}
                  />
                  <YAxis
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={axisFormatter}
                  />
                  <ReferenceLine y={0} stroke="var(--line-strong)" strokeWidth={1} />
                  <Tooltip
                    wrapperStyle={chartTooltipWrapperStyle}
                    cursor={{ fill: "var(--chart-cursor)" }}
                    content={
                      <ChartTooltip
                        formatLabel={(label) => `Calculated trade balance · ${String(label ?? "")}`}
                        formatValue={(value) =>
                          `${formatExact(value)} ${
                            value < 0 ? "(deficit)" : value > 0 ? "(surplus)" : ""
                          }`.trim()
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="balance"
                    name="Exports minus imports"
                    radius={[2, 2, 0, 0]}
                    barSize={20}
                    isAnimationActive={false}
                  >
                    {series.map((row) => (
                      <Cell
                        key={row.year}
                        fill={
                          row.balance !== null && row.balance < 0
                            ? "var(--chart-blue)"
                            : "var(--chart-emerald)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto">
              <ChartSourceFooter
                providerUpdated={providerUpdated}
                note="Calculated, not a source-published balance."
              />
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
