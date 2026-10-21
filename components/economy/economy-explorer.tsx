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
import { useLanguage } from "@/components/language-provider";
import type { Language } from "@/lib/i18n";

type ChartType = "line" | "bar";

const COPY = {
  en: {
    annualPeriod: (year: number) => `Annual · ${year}`,
    noObservation: "No observation",
    noIndicatorsTitle: "No economic indicators available",
    noIndicatorsDescription:
      "We couldn't load any usable annual series for Bangladesh. No placeholder values are shown. Try refreshing the page.",
    selectTitle: "Select an indicator",
    selectDescription:
      "Seven annual World Bank series. Choose a metric to explore its history, units, and observations.",
    selectAria: "Economic indicators",
    historyTitle: (name: string) => `${name} history`,
    historyDescription: (name: string, unit: string) =>
      `${name} · Unit: ${unit}`,
    chartType: "Chart type",
    line: "Line",
    bar: "Bar",
    from: "From",
    to: "to",
    toYear: "To year",
    calendarYears: (count: number) => `${count} calendar years`,
    definitionLabel: "Definition:",
    bdtNote:
      "The World Bank publishes this series in US dollars; the values shown here are converted to BDT at the current reference rate.",
    emptyRangeTitle: "No reported observation in this range",
    emptyRangeDescription:
      "Choose a different year range. Missing annual observations are not interpolated or replaced with estimates.",
    chartAria: (type: string, name: string, from: number, to: number) =>
      `${type} chart of ${name} for Bangladesh from ${from} to ${to}.`,
    lineChart: "Line",
    barChart: "Bar",
    annualObservation: (label: string | number | undefined) =>
      `Annual observation · ${String(label ?? "")}`,
    yAxis: (unit: string, count: number) =>
      `Y-axis: ${unit}. ${count} reported ${count === 1 ? "year" : "years"} selected.`,
    indicatorPage: "World Bank indicator page",
    aboutTitle: "About this indicator",
    aboutDescription: "Definition, units, and source dates.",
    unit: "Unit",
    frequency: "Frequency",
    annual: "Annual",
    latestYear: "Latest year",
    sourceUpdated: "Source updated",
    retrieved: "Retrieved",
    licence: "Licence",
    cadence: "Annual · periodic",
    sourcePage: "World Bank source page",
    gapsTitle: "Reported observation gaps",
    gapsBody: (gaps: string) =>
      `Missing years in the returned series: ${gaps}. They are left empty in charts and are not estimated.`,
    note:
      "Annual values can be revised by the World Bank. The observation year is not the date we checked the source.",
    tableTitle: "Annual data table",
    tableDescription: (name: string) =>
      `Reported observations for ${name}. Changes are shown only against the immediately preceding year.`,
    tableAria: "Annual economic data table",
    tableCaption: (name: string) =>
      `${name} annual observations for Bangladesh`,
    year: "Year",
    value: "Value",
    change: "Change vs prior year",
    source: "Source",
    latest: "Latest",
    sourceName: "World Bank",
    tableNote:
      "Table lists reported observations only; years absent from the source are not synthesized. Negative changes are negative values, not an indicator judgment.",
  },
  bn: {
    annualPeriod: (year: number) => `বার্ষিক · ${year}`,
    noObservation: "কোনো পর্যবেক্ষণ নেই",
    noIndicatorsTitle: "কোনো অর্থনৈতিক সূচক পাওয়া যাচ্ছে না",
    noIndicatorsDescription:
      "বাংলাদেশের জন্য ব্যবহারযোগ্য কোনো বার্ষিক সিরিজ লোড করা যায়নি। কোনো প্লেসহোল্ডার মান দেখানো হচ্ছে না। পেজটি রিফ্রেশ করে দেখুন।",
    selectTitle: "একটি সূচক বাছুন",
    selectDescription:
      "সাতটি বার্ষিক বিশ্বব্যাংক সিরিজ। ইতিহাস, একক ও পর্যবেক্ষণ দেখতে একটি সূচক বাছুন।",
    selectAria: "অর্থনৈতিক সূচক",
    historyTitle: (name: string) => `${name} · সময়ের ধারা`,
    historyDescription: (name: string, unit: string) =>
      `${name} · একক: ${unit}`,
    chartType: "চার্টের ধরন",
    line: "রেখা",
    bar: "বার",
    from: "শুরু",
    to: "শেষ",
    toYear: "শেষ বছর",
    calendarYears: (count: number) => `${count}টি ক্যালেন্ডার বছর`,
    definitionLabel: "সংজ্ঞা:",
    bdtNote:
      "বিশ্বব্যাংক এই সিরিজটি মার্কিন ডলারে প্রকাশ করে; এখানে দেখানো মান চলতি রেফারেন্স হারে টাকায় রূপান্তর করা।",
    emptyRangeTitle: "এই পরিসরে কোনো রিপোর্ট করা পর্যবেক্ষণ নেই",
    emptyRangeDescription:
      "অন্য বছর পরিসর বাছুন। অনুপস্থিত বার্ষিক পর্যবেক্ষণ অনুমান করে পূরণ বা প্রতিস্থাপন করা হয় না।",
    chartAria: (type: string, name: string, from: number, to: number) =>
      `${from} থেকে ${to} পর্যন্ত বাংলাদেশের ${name}-এর ${type} চার্ট।`,
    lineChart: "রেখা",
    barChart: "বার",
    annualObservation: (label: string | number | undefined) =>
      `বার্ষিক পর্যবেক্ষণ · ${String(label ?? "")}`,
    yAxis: (unit: string, count: number) =>
      `Y-অক্ষ: ${unit}। ${count}টি রিপোর্ট করা বছর নির্বাচিত।`,
    indicatorPage: "বিশ্বব্যাংক সূচক পেজ",
    aboutTitle: "এই সূচক সম্পর্কে",
    aboutDescription: "সংজ্ঞা, একক ও উৎসের তারিখ।",
    unit: "একক",
    frequency: "হালনাগাদের ধরন",
    annual: "বার্ষিক",
    latestYear: "সর্বশেষ বছর",
    sourceUpdated: "উৎস হালনাগাদ",
    retrieved: "সংগ্রহ",
    licence: "লাইসেন্স",
    cadence: "বার্ষিক · সাময়িক",
    sourcePage: "বিশ্বব্যাংক উৎস পেজ",
    gapsTitle: "রিপোর্ট করা পর্যবেক্ষণের ফাঁক",
    gapsBody: (gaps: string) =>
      `প্রাপ্ত সিরিজে অনুপস্থিত বছর: ${gaps}। চার্টে এগুলো খালি রাখা হয় এবং অনুমান করা হয় না।`,
    note:
      "বার্ষিক মান বিশ্বব্যাংক সংশোধন করতে পারে। পর্যবেক্ষণের বছর মানে আমরা উৎস কবে যাচাই করেছি সেই তারিখ নয়।",
    tableTitle: "বার্ষিক ডেটা টেবিল",
    tableDescription: (name: string) =>
      `${name}-এর রিপোর্ট করা পর্যবেক্ষণ। পরিবর্তন কেবল ঠিক আগের বছরের বিপরীতে দেখানো হয়।`,
    tableAria: "বার্ষিক অর্থনৈতিক ডেটা টেবিল",
    tableCaption: (name: string) =>
      `বাংলাদেশের জন্য ${name}-এর বার্ষিক পর্যবেক্ষণ`,
    year: "বছর",
    value: "মান",
    change: "আগের বছরের তুলনায় পরিবর্তন",
    source: "উৎস",
    latest: "সর্বশেষ",
    sourceName: "World Bank",
    tableNote:
      "টেবিল কেবল রিপোর্ট করা পর্যবেক্ষণ দেখায়; উৎসে অনুপস্থিত বছর তৈরি করা হয় না। নেতিবাচক পরিবর্তন মানে নেতিবাচক মান, সূচক সম্পর্কে কোনো রায় নয়।",
  },
};

function axisFormatter(unit: MetricUnit): (value: number) => string {
  if (unit === "percent") return formatAxisPercent;
  if (unit === "bdt") return formatAxisBdt;
  if (unit === "usd") return formatAxisUsd;
  return formatAxisNumber;
}

function tooltipFormatter(
  unit: MetricUnit,
  language: Language,
): (value: number) => string {
  return (value) => formatIndicatorExact(unit, value, language);
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
  const language = useLanguage();
  const copy = COPY[language];
  const latest = indicator.latest;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "min-w-0 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-brand bg-brand-soft"
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted/60",
      )}
    >
      <span
        className={cn(
          "line-clamp-2 text-[12px] font-semibold leading-4 tracking-[0.01em]",
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
          "mt-0.5 block text-[11px]",
          selected ? "text-brand-strong" : "text-subtle",
        )}
      >
        {latest ? copy.annualPeriod(latest.year) : copy.noObservation}
      </span>
    </button>
  );
}

export function EconomyExplorer({ analytics }: { analytics: AnalyticsData }) {
  const language = useLanguage();
  const copy = COPY[language];
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
          title={copy.noIndicatorsTitle}
          description={copy.noIndicatorsDescription}
        />
      </Panel>
    );
  }

  const definition = INDICATOR_DEFINITIONS[selected.key];
  const definitionCopy = language === "bn" ? definition.bn : definition;
  const axis = axisFormatter(selected.unit);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={copy.selectTitle}
          description={copy.selectDescription}
        />
        <div
          className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4"
          role="group"
          aria-label={copy.selectAria}
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
            title={copy.historyTitle(definitionCopy.shortName)}
            description={copy.historyDescription(selected.name, selected.unitLabel)}
            action={
              <div
                className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5"
                role="group"
                aria-label={copy.chartType}
              >
                <button
                  type="button"
                  onClick={() => setChartType("line")}
                  aria-pressed={chartType === "line"}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    chartType === "line"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <ChartLine className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.line}
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  aria-pressed={chartType === "bar"}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    chartType === "bar"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <ChartColumn className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.bar}
                </button>
              </div>
            }
          />

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="from-year" className="text-[11px] font-medium text-subtle">
                  {copy.from}
                </label>
                <select
                  id="from-year"
                  value={fromYear}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setRange({ from: next, to: next > toYear ? next : toYear });
                  }}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-subtle">{copy.to}</span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="to-year" className="sr-only">
                  {copy.toYear}
                </label>
                <select
                  id="to-year"
                  value={toYear}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setRange({ from: next < fromYear ? next : fromYear, to: next });
                  }}
                  className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-subtle">
                {copy.calendarYears(toYear - fromYear + 1)}
              </span>
            </div>
            <ChartLegend
              items={[
                {
                  label: definitionCopy.shortName,
                  color: definition.chartColor,
                  shape: chartType === "line" ? "line" : "bar",
                },
              ]}
            />
          </div>

          {!hasAnyValue ? (
            <EmptyState
              title={copy.emptyRangeTitle}
              description={copy.emptyRangeDescription}
              className="py-12"
            />
          ) : (
            <div
              className="h-[310px] w-full px-2 pb-2 pt-4 sm:h-[340px] sm:px-3"
              role="group"
              aria-label={copy.chartAria(
                chartType === "line" ? copy.lineChart : copy.barChart,
                selected.name,
                fromYear,
                toYear,
              )}
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
                    tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={16}
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
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
                        formatLabel={copy.annualObservation}
                        formatValue={tooltipFormatter(selected.unit, language)}
                      />
                    }
                  />
                  {chartType === "line" ? (
                    <Line
                      type="linear"
                      dataKey="value"
                      name={definitionCopy.shortName}
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
                      name={definitionCopy.shortName}
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[11px] leading-4 text-subtle sm:px-6">
            <p>
              {copy.yAxis(selected.unitLabel, tableRows.length)}
            </p>
            <SourceLink
              href={selected.source.sourceUrl}
              className="text-muted"
            >
              {copy.indicatorPage}
            </SourceLink>
          </div>
        </Panel>

        <Panel className="flex h-full min-w-0 flex-col">
          <PanelHeader
            title={copy.aboutTitle}
            description={copy.aboutDescription}
          />
          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-[13px] leading-6 text-muted">{selected.definition}</p>

            <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line text-[12px]">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">{copy.unit}</dt>
                <dd className="text-right font-medium text-foreground">
                  {selected.unitLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">{copy.frequency}</dt>
                <dd className="font-medium text-foreground">{copy.annual}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">{copy.latestYear}</dt>
                <dd className="font-medium tabular text-foreground">
                  {selected.latest?.year ?? "\u2014"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">{copy.sourceUpdated}</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatUtcDate(selected.source.datasetUpdated)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">{copy.retrieved}</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatUtcDateTime(selected.source.retrievedAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-subtle">{copy.licence}</dt>
                <dd className="font-medium text-foreground">
                  {selected.source.license}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <CadenceBadge cadence="periodic" label={copy.cadence} />
              <SourceLink href={selected.source.sourceUrl} className="text-[11px]">
                {copy.sourcePage}
              </SourceLink>
            </div>

            {gaps ? (
              <DataNotice title={copy.gapsTitle} tone="warning">
                {copy.gapsBody(gaps)}
              </DataNotice>
            ) : null}

            <div className="mt-auto flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden="true" />
              <p className="text-[11px] leading-4 text-muted">
                {copy.note}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title={copy.tableTitle}
          description={copy.tableDescription(definitionCopy.shortName)}
          action={
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-mono text-[11px] text-muted">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {copy.annual}
            </span>
          }
        />
        <div
          className="table-scroll overflow-x-auto scrollbar-subtle"
          role="region"
          aria-label={copy.tableAria}
          tabIndex={0}
        >
          <table className="w-full min-w-[620px] text-left text-[13px]">
            <caption className="sr-only">
              {copy.tableCaption(selected.name)}
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-muted/60 text-[11px] uppercase tracking-[0.08em] text-subtle">
                <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                  {copy.year}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  {copy.value}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  {copy.change}
                </th>
                <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                  {copy.source}
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
                        language,
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
                          <span className="rounded bg-brand-soft px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-strong">
                            {copy.latest}
                          </span>
                        ) : null}
                      </span>
                    </th>
                    <td
                      className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular text-foreground"
                      title={
                        observation.value !== null
                          ? formatIndicatorExact(selected.unit, observation.value, language)
                          : undefined
                      }
                    >
                      {observation.value !== null ? (
                        <>
                          {formatIndicatorValue(selected, observation.value)}
                          <span className="sr-only">
                            {formatIndicatorExact(selected.unit, observation.value, language)}
                          </span>
                        </>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular text-muted">
                      {change}
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-muted sm:px-6">
                      <SourceLink
                        href={selected.source.sourceUrl}
                        className="text-[12px]"
                      >
                        {copy.sourceName}
                      </SourceLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-5 py-3 text-[11px] leading-4 text-subtle sm:px-6">
          {copy.tableNote}
        </div>
      </Panel>
    </div>
  );
}
