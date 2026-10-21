"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsData, EconomicIndicator } from "@/lib/api/types";
import {
  formatAxisPercent,
  formatAxisUsd,
  formatPercent,
  formatPercentPrecise,
  formatUsdExact,
  formatUtcDate,
} from "@/lib/utils/format";
import { mergeIndicatorSeries } from "@/lib/utils/metrics";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip, chartTooltipWrapperStyle } from "@/components/charts/chart-tooltip";
import { ChartEmpty } from "@/components/charts/chart-empty";

const CHART_MARGIN = { top: 10, right: 10, left: -4, bottom: 0 };
const GRID_COLOR = "var(--chart-grid)";
const AXIS_COLOR = "var(--chart-axis)";

const axisTick = { fill: AXIS_COLOR, fontSize: 10 } as const;

function latestYearLabel(...indicators: Array<EconomicIndicator | null>): string {
  const years = indicators
    .map((indicator) => indicator?.latest?.year)
    .filter((year): year is number => typeof year === "number");

  return years.length > 0 ? `Latest observation · ${Math.max(...years)}` : "No observations";
}

function ChartSource({
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
        {providerUpdated ? ` · provider updated ${formatUtcDate(providerUpdated)}` : null}
      </p>
    </div>
  );
}

function YearAxis() {
  return (
    <XAxis
      dataKey="year"
      tick={axisTick}
      axisLine={false}
      tickLine={false}
      minTickGap={18}
      interval="preserveStartEnd"
      height={24}
    />
  );
}

export function EconomicPerformanceChart({
  analytics,
}: {
  analytics: AnalyticsData;
}) {
  const growth = analytics.indicators.gdpGrowth;
  const inflation = analytics.indicators.inflation;

  const data = mergeIndicatorSeries(growth, inflation).map((row) => ({
    year: row.year,
    growth: row.left,
    inflation: row.right,
  }));
  const firstYear = data[0]?.year;
  const lastYear = data[data.length - 1]?.year;
  const yearRange =
    firstYear !== undefined && lastYear !== undefined
      ? ` from ${firstYear} to ${lastYear}`
      : "";

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Economic performance"
        description="Annual GDP growth against consumer price inflation. Y-axis: annual percent (%)."
        action={
          <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] font-medium text-muted">
            {latestYearLabel(growth, inflation)}
          </span>
        }
      />
      {data.length === 0 ? (
        <ChartEmpty description="Neither GDP growth nor inflation could be loaded from the World Bank." />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-6">
            <ChartLegend
              items={[
                { label: "GDP growth (annual %)", color: "var(--chart-emerald)", shape: "bar" },
                { label: "Consumer price inflation (annual %)", color: "var(--chart-amber)", shape: "line" },
              ]}
            />
            <p className="text-[10px] text-subtle">Annual observations</p>
          </div>
          <div
            className="h-[300px] w-full px-2 pb-2 pt-3 sm:h-[320px] sm:px-3"
            role="group"
            aria-label={`Combined chart of annual GDP growth bars and consumer price inflation line for Bangladesh${yearRange}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={CHART_MARGIN}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                  tickFormatter={formatAxisPercent}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  cursor={{ fill: "var(--chart-cursor)" }}
                  content={
                    <ChartTooltip
                      formatLabel={(label) => `Annual observation · ${String(label ?? "")}`}
                      formatValue={(value) => formatPercentPrecise(value)}
                    />
                  }
                />
                <Bar
                  dataKey="growth"
                  name="GDP growth"
                  fill="var(--chart-emerald)"
                  radius={[3, 3, 0, 0]}
                  barSize={18}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="inflation"
                  name="Inflation"
                  stroke="var(--chart-amber)"
                  strokeWidth={2.4}
                  dot={{ r: 2.5, fill: "var(--chart-amber)", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto">
            <ChartSource
              providerUpdated={growth?.source.datasetUpdated ?? inflation?.source.datasetUpdated ?? null}
              note="Official annual statistics. Gaps are not interpolated."
            />
          </div>
        </>
      )}
    </Panel>
  );
}

function densifyMixedRows(
  rows: Array<{ year: number; left: number | null; right: number | null }>,
) {
  if (rows.length === 0) return [];

  const map = new Map(rows.map((row) => [row.year, row]));
  const min = rows[0].year;
  const max = rows[rows.length - 1].year;
  const dense: Array<{ year: number; left: number | null; right: number | null }> = [];

  for (let year = min; year <= max; year += 1) {
    dense.push(map.get(year) ?? { year, left: null, right: null });
  }

  return dense;
}

export function TradeFlowsChart({ analytics }: { analytics: AnalyticsData }) {
  const exportsIndicator = analytics.indicators.exports;
  const importsIndicator = analytics.indicators.imports;

  const rows = densifyMixedRows(
    mergeIndicatorSeries(exportsIndicator, importsIndicator),
  );

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Exports vs imports"
        description="Goods and services, current US dollars. Y-axis: current US$."
        action={
          <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] font-medium text-muted">
            {latestYearLabel(exportsIndicator, importsIndicator)}
          </span>
        }
      />
      {rows.length === 0 ? (
        <ChartEmpty description="World Bank trade observations are currently unavailable." />
      ) : (
        <>
          <div className="px-5 pt-4 sm:px-6">
            <ChartLegend
              items={[
                { label: "Exports", color: "var(--chart-emerald)", shape: "bar" },
                { label: "Imports", color: "var(--chart-blue)", shape: "bar" },
              ]}
            />
          </div>
          <div
            className="h-[280px] w-full px-2 pb-2 pt-3 sm:px-3"
            role="group"
            aria-label="Grouped bar chart comparing annual goods and services exports with imports."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={CHART_MARGIN} barGap={2}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={formatAxisUsd}
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  cursor={{ fill: "var(--chart-cursor)" }}
                  content={
                    <ChartTooltip
                      formatLabel={(label) => `Annual trade flows · ${String(label ?? "")}`}
                      formatValue={(value) => formatUsdExact(value)}
                    />
                  }
                />
                <Bar
                  dataKey="left"
                  name="Exports of goods & services"
                  fill="var(--chart-emerald)"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="right"
                  name="Imports of goods & services"
                  fill="var(--chart-blue)"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto">
            <ChartSource
              providerUpdated={
                exportsIndicator?.source.datasetUpdated ??
                importsIndicator?.source.datasetUpdated ??
                null
              }
              note="Goods and services only — not merchandise-only trade."
            />
          </div>
        </>
      )}
    </Panel>
  );
}

export function GdpGrowthTrendChart({
  indicator,
}: {
  indicator: EconomicIndicator | null;
}) {
  const data = indicator?.observations ?? [];
  const latest = indicator?.latest;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="GDP growth trend"
        description="Annual growth in constant-price GDP. Y-axis: annual percent (%)."
        action={
          latest ? (
            <span className="font-mono text-[11px] font-semibold text-brand-strong">
              {formatPercent(latest.value, 2)} · {latest.year}
            </span>
          ) : null
        }
      />
      {data.length === 0 ? (
        <ChartEmpty title="GDP growth unavailable" />
      ) : (
        <>
          <div
            className="h-[230px] w-full px-2 pb-1 pt-4 sm:px-3"
            role="group"
            aria-label="Area chart of Bangladesh annual GDP growth from the latest ten reported years."
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={CHART_MARGIN}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <YearAxis />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tickFormatter={formatAxisPercent}
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 3" }}
                  content={
                    <ChartTooltip
                      formatLabel={(label) => `Annual observation · ${String(label ?? "")}`}
                      formatValue={(value) => formatPercentPrecise(value)}
                    />
                  }
                />
                <Area
                  type="linear"
                  dataKey="value"
                  name="GDP growth"
                  stroke="var(--chart-emerald)"
                  strokeWidth={2.4}
                  fill="var(--chart-emerald)"
                  fillOpacity={0.1}
                  dot={{ r: 2.2, fill: "var(--chart-emerald)", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto">
            <ChartSource
              providerUpdated={indicator?.source.datasetUpdated ?? null}
              note="Annual, periodically revised. No extrapolation."
            />
          </div>
        </>
      )}
    </Panel>
  );
}

export function InflationTrendChart({
  indicator,
}: {
  indicator: EconomicIndicator | null;
}) {
  const data = indicator?.observations ?? [];
  const latest = indicator?.latest;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Inflation trend"
        description="Consumer price inflation. Y-axis: annual percent (%)."
        action={
          latest ? (
            <span className="font-mono text-[11px] font-semibold text-amber">
              {formatPercent(latest.value, 2)} · {latest.year}
            </span>
          ) : null
        }
      />
      {data.length === 0 ? (
        <ChartEmpty title="Inflation data unavailable" />
      ) : (
        <>
          <div
            className="h-[230px] w-full px-2 pb-1 pt-4 sm:px-3"
            role="group"
            aria-label="Line chart of Bangladesh annual consumer price inflation from the latest ten reported years."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={CHART_MARGIN}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <YearAxis />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tickFormatter={formatAxisPercent}
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 3" }}
                  content={
                    <ChartTooltip
                      formatLabel={(label) => `Annual observation · ${String(label ?? "")}`}
                      formatValue={(value) => formatPercentPrecise(value)}
                    />
                  }
                />
                <Line
                  type="linear"
                  dataKey="value"
                  name="CPI inflation"
                  stroke="var(--chart-amber)"
                  strokeWidth={2.4}
                  dot={{ r: 2.2, fill: "var(--chart-amber)", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto">
            <ChartSource
              providerUpdated={indicator?.source.datasetUpdated ?? null}
              note="Annual, periodically revised. No extrapolation."
            />
          </div>
        </>
      )}
    </Panel>
  );
}
