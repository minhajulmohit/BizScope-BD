"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartColumn,
  ChartLine,
  Clock3,
  Info,
} from "lucide-react";
import type {
  AnalyticsData,
  EconomicIndicator,
  IndicatorKey,
  MetricUnit,
} from "@/lib/api/types";
import { INDICATOR_DEFINITIONS, INDICATOR_ORDER } from "@/lib/indicator-catalog";
import {
  formatAxisBdt,
  formatAxisNumber,
  formatAxisPercent,
  formatAxisUsd,
  formatIndicatorExact,
  formatIndicatorValue,
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import {
  densifyObservations,
  describeGaps,
  getObservationChangeLabel,
} from "@/lib/utils/metrics";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { DataNotice } from "@/components/ui/data-notice";
import { EmptyState } from "@/components/ui/states";
import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip, chartTooltipWrapperStyle } from "@/components/charts/chart-tooltip";

type ChartType = "line" | "bar";

function axisFormatter(unit: MetricUnit): (value: number) => string {
  if (unit === "percent") return formatAxisPercent;
  if (unit === "bdt") return formatAxisBdt;
  if (unit === "usd") return formatAxisUsd;
  return formatAxisNumber;
}

function tooltipFormatter(unit: MetricUnit): (value: number) => string {
  return (value) => formatIndicatorExact(unit, value);
}

function MetricButton({
  indicator,
  selected,
  onSelect,
}: {
  indicator: EconomicIndicator;
  selected: boolean;
  onSelect: () => void;
}) {
  const latest = indicator.latest;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "min-w-0 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-brand bg-brand-soft"
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted/60",
      )}
    >
      <span
        className={cn(
          "block truncate text-[10px] font-semibold uppercase tracking-[0.04em]",
          selected ? "text-brand-strong" : "text-muted",
        )}
        title={indicator.shortName}
      >
        {indicator.shortName}
      </span>
      <span className="mt-1 block truncate text-[15px] font-semibold tracking-[-0.025em] tabular text-foreground">
        {latest ? formatIndicatorValue(indicator, latest.value) : "\u2014"}
      </span>
      <span
        className={cn(
          "mt-0.5 block text-[9px]",
          selected ? "text-brand-strong" : "text-subtle",
        )}
      >
        {latest ? `Annual · ${latest.year}` : "No observation"}
      </span>
    </button>
  );
}

export function EconomyExplorer({ analytics }: { analytics: AnalyticsData }) {
  const available = useMemo(
    () =>
      INDICATOR_ORDER.map((key) => analytics.indicators[key]).filter(
        (indicator): indicator is EconomicIndicator => indicator !== null,
      ),
    [analytics.indicators],
  );

  const [selectedKey, setSelectedKey] = useState<IndicatorKey>(
    available[0]?.key ?? "gdp",
  );
  const [chartType, setChartType] = useState<ChartType>("line");
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);

  const selected =
    analytics.indicators[selectedKey] ?? available[0] ?? null;

  const yearValues = useMemo(
    () => selected?.observations.map((observation) => observation.year) ?? [],
    [selected],
  );
  const minYear = yearValues.length ? Math.min(...yearValues) : null;
  const maxYear = yearValues.length ? Math.max(...yearValues) : null;

  const fromYear =
    minYear === null
      ? 0
      : Math.min(Math.max(range?.from ?? minYear, minYear), maxYear ?? minYear);
  const toYear =
    maxYear === null
      ? 0
      : Math.min(Math.max(range?.to ?? maxYear, minYear ?? maxYear), maxYear);

  const chartData = useMemo(() => {
    if (!selected || minYear === null) return [];
    return densifyObservations(selected.observations, fromYear, toYear);
  }, [selected, minYear, fromYear, toYear]);

  const tableRows = useMemo(() => {
    if (!selected) return [];
    return selected.observations.filter(
      (observation) =>
        observation.year >= fromYear && observation.year <= toYear,
    );
  }, [selected, fromYear, toYear]);

  const observationMap = useMemo(
    () =>
      new Map(
        (selected?.observations ?? []).map((observation) => [
          observation.year,
          observation.value,
        ]),
      ),
    [selected],
  );

  const gaps = selected ? describeGaps(selected.observations) : null;
  const hasAnyValue = chartData.some((row) => row.value !== null);
  const yearOptions =
    minYear === null || maxYear === null
      ? []
      : Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);

  function selectMetric(key: IndicatorKey) {
    setSelectedKey(key);
    setRange(null);
  }

  if (!selected || available.length === 0) {
    return (
      <Panel>
        <EmptyState
          title="No economic indicators available"
          description="We couldn't load any usable annual series for Bangladesh. No placeholder values are shown. Try refreshing the page."
        />
      </Panel>
    );
  }

  const definition = INDICATOR_DEFINITIONS[selected.key];
  const axis = axisFormatter(selected.unit);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Select an indicator"
          description="Seven annual World Bank series. Choose a metric to explore its history, units, and observations."
        />
        <div
          className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
          role="group"
          aria-label="Economic indicators"
        >
          {available.map((indicator) => (
            <MetricButton
              key={indicator.key}
              indicator={indicator}
              selected={selected.key === indicator.key}
              onSelect={() => selectMetric(indicator.key)}
            />
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="min-w-0 xl:col-span-2">
          <PanelHeader
            title={`${definition.shortName} history`}
            description={`${selected.name} · Unit: ${selected.unitLabel}`}
            action={
              <div
                className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5"
                role="group"
                aria-label="Chart type"
              >
                <button
                  type="button"
                  onClick={() => setChartType("line")}
                  aria-pressed={chartType === "line"}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    chartType === "line"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <ChartLine className="h-3.5 w-3.5" aria-hidden="true" />
                  Line
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  aria-pressed={chartType === "bar"}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    chartType === "bar"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <ChartColumn className="h-3.5 w-3.5" aria-hidden="true" />
                  Bar
                </button>
              </div>
            }
          />

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="from-year" className="text-[10px] font-medium text-subtle">
                  From
                </label>
                <select
                  id="from-year"
                  value={fromYear}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setRange({ from: next, to: next > toYear ? next : toYear });
                  }}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[11px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-subtle">to</span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="to-year" className="sr-only">
                  To year
                </label>
                <select
                  id="to-year"
                  value={toYear}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setRange({ from: next < fromYear ? next : fromYear, to: next });
                  }}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[11px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-subtle">
                {toYear - fromYear + 1} calendar years
              </span>
            </div>
            <ChartLegend
              items={[
                {
                  label: definition.shortName,
                  color: definition.chartColor,
                  shape: chartType === "line" ? "line" : "bar",
                },
              ]}
            />
          </div>

          <div className="px-5 pt-4 sm:px-6">
            <div className="rounded-lg border border-line bg-surface-muted/40 px-3 py-2">
              <p className="text-[10px] leading-4 text-muted">
                <span className="font-semibold text-foreground-soft">Definition:</span>{" "}
                {definition.definition}
                {selected.unit === "bdt"
                  ? " The World Bank publishes this series in US dollars; the values shown here are converted to BDT at the current reference rate."
                  : ""}
              </p>
            </div>
          </div>

          {!hasAnyValue ? (
            <EmptyState
              title="No reported observation in this range"
              description="Choose a different year range. Missing annual observations are not interpolated or replaced with estimates."
              className="py-12"
            />
          ) : (
            <div
              className="h-[310px] w-full px-2 pb-2 pt-4 sm:h-[340px] sm:px-3"
              role="group"
              aria-label={`${chartType} chart of ${selected.name} for Bangladesh from ${fromYear} to ${toYear}.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: -2, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={16}
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tickFormatter={axis}
                  />
                  <Tooltip
                    wrapperStyle={chartTooltipWrapperStyle}
                    cursor={{ fill: "var(--chart-cursor)" }}
                    content={
                      <ChartTooltip
                        formatLabel={(label) => `Annual observation · ${String(label ?? "")}`}
                        formatValue={tooltipFormatter(selected.unit)}
                      />
                    }
                  />
                  {chartType === "line" ? (
                    <Line
                      type="linear"
                      dataKey="value"
                      name={definition.shortName}
                      stroke={definition.chartColor}
                      strokeWidth={2.5}
                      dot={{
                        r: 2.4,
                        fill: definition.chartColor,
                        strokeWidth: 0,
                      }}
                      activeDot={{ r: 4.5 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ) : (
                    <Bar
                      dataKey="value"
                      name={definition.shortName}
                      fill={definition.chartColor}
                      radius={[3, 3, 0, 0]}
                      barSize={20}
                      isAnimationActive={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
            <p>
              Y-axis: {selected.unitLabel}. {tableRows.length} reported{" "}
              {tableRows.length === 1 ? "year" : "years"} selected.
            </p>
            <SourceLink
              href={selected.source.sourceUrl}
              className="text-muted"
            >
              World Bank indicator page
            </SourceLink>
          </div>
        </Panel>

        <Panel className="flex h-full min-w-0 flex-col">
          <PanelHeader
            title="About this indicator"
            description="Definition, units, and source dates."
          />
          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-[12px] leading-6 text-muted">{selected.definition}</p>

            <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line text-[11px]">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">Unit</dt>
                <dd className="text-right font-medium text-foreground">
                  {selected.unitLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">Frequency</dt>
                <dd className="font-medium text-foreground">Annual</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">Latest year</dt>
                <dd className="font-medium tabular text-foreground">
                  {selected.latest?.year ?? "\u2014"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">Source updated</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatUtcDate(selected.source.datasetUpdated)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">Retrieved</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatUtcDateTime(selected.source.retrievedAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">Licence</dt>
                <dd className="font-medium text-foreground">
                  {selected.source.license}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <CadenceBadge cadence="periodic" label="Annual · periodic" />
              <SourceLink href={selected.source.sourceUrl} className="text-[10px]">
                World Bank source page
              </SourceLink>
            </div>

            {gaps ? (
              <DataNotice title="Reported observation gaps" tone="warning">
                Missing years in the returned series: {gaps}. They are left empty
                in charts and are not estimated.
              </DataNotice>
            ) : null}

            <div className="mt-auto flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden="true" />
              <p className="text-[10px] leading-4 text-muted">
                Annual values can be revised by the World Bank. The observation
                year is not the date we checked the source.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Annual data table"
          description={`Reported observations for ${definition.shortName}. Changes are shown only against the immediately preceding year.`}
          action={
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              Annual
            </span>
          }
        />
        <div
          className="table-scroll overflow-x-auto scrollbar-subtle"
          role="region"
          aria-label="Annual economic data table"
          tabIndex={0}
        >
          <table className="w-full min-w-[620px] text-left text-[12px]">
            <caption className="sr-only">
              {selected.name} annual observations for Bangladesh
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-muted/60 text-[10px] uppercase tracking-[0.08em] text-subtle">
                <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                  Year
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  Value
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  Change vs prior year
                </th>
                <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tableRows.map((observation) => {
                const previous =
                  observationMap.get(observation.year - 1) ?? null;
                const change =
                  observation.value !== null && previous !== null
                    ? getObservationChangeLabel(
                        selected.unit,
                        observation.value,
                        previous,
                      )
                    : "\u2014";

                return (
                  <tr
                    key={observation.year}
                    className="transition-colors hover:bg-surface-muted/40"
                  >
                    <th scope="row" className="px-5 py-2.5 font-medium text-foreground sm:px-6">
                      <span className="inline-flex items-center gap-2">
                        {observation.year}
                        {selected.latest?.year === observation.year ? (
                          <span className="rounded bg-brand-soft px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-brand-strong">
                            Latest
                          </span>
                        ) : null}
                      </span>
                    </th>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular text-foreground"
                      title={
                        observation.value !== null
                          ? formatIndicatorExact(selected.unit, observation.value)
                          : undefined
                      }
                    >
                      {observation.value !== null ? (
                        <>
                          {formatIndicatorValue(selected, observation.value)}
                          <span className="sr-only">
                            {formatIndicatorExact(selected.unit, observation.value)}
                          </span>
                        </>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular text-muted">
                      {change}
                    </td>
                    <td className="px-5 py-2.5 text-[11px] text-muted sm:px-6">
                      <SourceLink
                        href={selected.source.sourceUrl}
                        className="text-[11px]"
                      >
                        World Bank
                      </SourceLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
          Table lists reported observations only; years absent from the source are
          not synthesized. Negative changes are negative values, not an indicator
          judgment.
        </div>
      </Panel>
    </div>
  );
}
