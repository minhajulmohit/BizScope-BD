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
import type { Language } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import {
  formatAxisBdt,
  formatAxisPercent,
  formatAxisUsd,
  formatBdtExact,
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

const COPY = {
  en: {
    latestObservation: (year: number) => `Latest observation · ${year}`,
    noObservations: "No observations",
    sourceUpdated: (date: string) => ` · source updated ${date}`,
    annualObservations: "Annual observations",
    annualObservation: (label: string | number | undefined) =>
      `Annual observation · ${String(label ?? "")}`,
    noInterpolation: "Official annual statistics. Gaps are not interpolated.",
    economicTitle: "Economic performance",
    economicDescription:
      "Annual GDP growth against consumer price inflation. Y-axis: annual percent (%).",
    economicAria: (range: string) =>
      `Combined chart of annual GDP growth bars and consumer price inflation line for Bangladesh${range}.`,
    economicEmpty:
      "Neither GDP growth nor inflation could be loaded from the World Bank.",
    gdpGrowthLegend: "GDP growth (annual %)",
    inflationLegend: "Consumer price inflation (annual %)",
    gdpGrowthName: "GDP growth",
    inflationName: "Inflation",
    tradeTitle: "Exports vs imports",
    tradeDescriptionBdt:
      "Goods and services, shown in BDT equivalents at the current reference rate.",
    tradeDescriptionUsd:
      "Goods and services, shown in the source currency because the reference rate is unavailable.",
    tradeEmpty: "World Bank trade observations are currently unavailable.",
    exports: "Exports",
    imports: "Imports",
    exportsName: "Exports of goods & services",
    importsName: "Imports of goods & services",
    tradeAria: (unit: string) =>
      `Grouped bar chart comparing annual goods and services exports with imports in ${unit}.`,
    tradeTooltip: (label: string | number | undefined) =>
      `Annual trade flows · ${String(label ?? "")}`,
    tradeNoteBdt:
      "Goods and services only. Taka values use the current reference rate.",
    tradeNoteUsd:
      "Goods and services only. Shown in US dollars because the taka reference rate is unavailable.",
    gdpTitle: "GDP growth trend",
    gdpDescription: "Annual growth in constant-price GDP. Y-axis: annual percent (%).",
    gdpUnavailable: "GDP growth unavailable",
    gdpAria:
      "Area chart of Bangladesh annual GDP growth from the latest ten reported years.",
    inflationTitle: "Inflation trend",
    inflationDescription: "Consumer price inflation. Y-axis: annual percent (%).",
    inflationUnavailable: "Inflation data unavailable",
    inflationAria:
      "Line chart of Bangladesh annual consumer price inflation from the latest ten reported years.",
    cpiName: "CPI inflation",
    annualRevised: "Annual, periodically revised. No extrapolation.",
  },
  bn: {
    latestObservation: (year: number) => `সর্বশেষ পর্যবেক্ষণ · ${year}`,
    noObservations: "কোনো পর্যবেক্ষণ নেই",
    sourceUpdated: (date: string) => ` · উৎস হালনাগাদ ${date}`,
    annualObservations: "বার্ষিক পর্যবেক্ষণ",
    annualObservation: (label: string | number | undefined) =>
      `বার্ষিক পর্যবেক্ষণ · ${String(label ?? "")}`,
    noInterpolation:
      "সরকারি বার্ষিক পরিসংখ্যান। ফাঁকগুলো অনুমান করে পূরণ করা হয় না।",
    economicTitle: "অর্থনৈতিক পারফরম্যান্স",
    economicDescription:
      "বার্ষিক জিডিপি প্রবৃদ্ধি বনাম ভোক্তা মূল্য মুদ্রাস্ফীতি। Y-অক্ষ: বার্ষিক শতাংশ (%)।",
    economicAria: (range: string) =>
      `বাংলাদেশের বার্ষিক জিডিপি প্রবৃদ্ধির বার ও ভোক্তা মূল্য মুদ্রাস্ফীতির রেখার সম্মিলিত চার্ট${range}।`,
    economicEmpty:
      "বিশ্বব্যাংক থেকে জিডিপি প্রবৃদ্ধি বা মুদ্রাস্ফীতি কোনোটিই লোড করা যায়নি।",
    gdpGrowthLegend: "জিডিপি প্রবৃদ্ধি (বার্ষিক %)",
    inflationLegend: "ভোক্তা মূল্য মুদ্রাস্ফীতি (বার্ষিক %)",
    gdpGrowthName: "জিডিপি প্রবৃদ্ধি",
    inflationName: "মুদ্রাস্ফীতি",
    tradeTitle: "রপ্তানি বনাম আমদানি",
    tradeDescriptionBdt:
      "পণ্য ও সেবা, চলতি রেফারেন্স হারে টাকার সমতুল্যে দেখানো হয়েছে।",
    tradeDescriptionUsd:
      "পণ্য ও সেবা, রেফারেন্স হার পাওয়া যায়নি বলে উৎসের মুদ্রায় দেখানো হয়েছে।",
    tradeEmpty: "বিশ্বব্যাংকের বাণিজ্য পর্যবেক্ষণ এখন পাওয়া যাচ্ছে না।",
    exports: "রপ্তানি",
    imports: "আমদানি",
    exportsName: "পণ্য ও সেবা রপ্তানি",
    importsName: "পণ্য ও সেবা আমদানি",
    tradeAria: (unit: string) =>
      `বার্ষিক পণ্য ও সেবা রপ্তানি ও আমদানির তুলনামূলক গ্রুপড বার চার্ট, ${unit}-এ।`,
    tradeTooltip: (label: string | number | undefined) =>
      `বার্ষিক বাণিজ্য প্রবাহ · ${String(label ?? "")}`,
    tradeNoteBdt:
      "শুধু পণ্য ও সেবা। টাকার মান চলতি রেফারেন্স হার ব্যবহার করে।",
    tradeNoteUsd:
      "শুধু পণ্য ও সেবা। টাকার রেফারেন্স হার পাওয়া যায়নি বলে মার্কিন ডলারে দেখানো হয়েছে।",
    gdpTitle: "জিডিপি প্রবৃদ্ধির প্রবণতা",
    gdpDescription:
      "স্থির মূল্যে জিডিপির বার্ষিক প্রবৃদ্ধি। Y-অক্ষ: বার্ষিক শতাংশ (%)।",
    gdpUnavailable: "জিডিপি প্রবৃদ্ধি পাওয়া যাচ্ছে না",
    gdpAria:
      "সর্বশেষ দশটি রিপোর্ট করা বছরের বাংলাদেশের বার্ষিক জিডিপি প্রবৃদ্ধির এরিয়া চার্ট।",
    inflationTitle: "মুদ্রাস্ফীতির প্রবণতা",
    inflationDescription:
      "ভোক্তা মূল্য মুদ্রাস্ফীতি। Y-অক্ষ: বার্ষিক শতাংশ (%)।",
    inflationUnavailable: "মুদ্রাস্ফীতির ডেটা পাওয়া যাচ্ছে না",
    inflationAria:
      "সর্বশেষ দশটি রিপোর্ট করা বছরের বাংলাদেশের বার্ষিক ভোক্তা মূল্য মুদ্রাস্ফীতির লাইন চার্ট।",
    cpiName: "ভোক্তা মূল্য সূচক মুদ্রাস্ফীতি",
    annualRevised: "বার্ষিক, সময়ে সময়ে সংশোধিত। কোনো অনুমান বা সম্প্রসারণ নেই।",
  },
};

function latestYearLabel(
  language: Language,
  ...indicators: Array<EconomicIndicator | null>
): string {
  const years = indicators
    .map((indicator) => indicator?.latest?.year)
    .filter((year): year is number => typeof year === "number");

  return years.length > 0
    ? COPY[language].latestObservation(Math.max(...years))
    : COPY[language].noObservations;
}

function ChartSource({
  providerUpdated,
  note,
}: {
  providerUpdated: string | null;
  note: string;
}) {
  const copy = COPY[useLanguage()];

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
        {providerUpdated ? copy.sourceUpdated(formatUtcDate(providerUpdated)) : null}
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
  const language = useLanguage();
  const copy = COPY[language];
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
      ? language === "bn"
        ? `, ${firstYear} থেকে ${lastYear} পর্যন্ত`
        : ` from ${firstYear} to ${lastYear}`
      : "";

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={copy.economicTitle}
        description={copy.economicDescription}
        action={
          <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] font-medium text-muted">
            {latestYearLabel(language, growth, inflation)}
          </span>
        }
      />
      {data.length === 0 ? (
        <ChartEmpty description={copy.economicEmpty} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-6">
            <ChartLegend
              items={[
                {
                  label: copy.gdpGrowthLegend,
                  color: "var(--chart-emerald)",
                  shape: "bar",
                },
                {
                  label: copy.inflationLegend,
                  color: "var(--chart-amber)",
                  shape: "line",
                },
              ]}
            />
            <p className="text-[10px] text-subtle">{copy.annualObservations}</p>
          </div>
          <div
            className="h-[300px] w-full px-2 pb-2 pt-3 sm:h-[320px] sm:px-3"
            role="group"
            aria-label={copy.economicAria(yearRange)}
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
                      formatLabel={copy.annualObservation}
                      formatValue={(value) => formatPercentPrecise(value)}
                    />
                  }
                />
                <Bar
                  dataKey="growth"
                  name={copy.gdpGrowthName}
                  fill="var(--chart-emerald)"
                  radius={[3, 3, 0, 0]}
                  barSize={18}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="inflation"
                  name={copy.inflationName}
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
              note={copy.noInterpolation}
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

export function TradeFlowsChart({
  analytics,
  inBdt,
}: {
  analytics: AnalyticsData;
  inBdt: boolean;
}) {
  const language = useLanguage();
  const copy = COPY[language];
  const exportsIndicator = analytics.indicators.exports;
  const importsIndicator = analytics.indicators.imports;

  const rows = densifyMixedRows(
    mergeIndicatorSeries(exportsIndicator, importsIndicator),
  );
  const axisFormatter = inBdt ? formatAxisBdt : formatAxisUsd;
  const formatExact = inBdt ? formatBdtExact : formatUsdExact;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={copy.tradeTitle}
        description={inBdt ? copy.tradeDescriptionBdt : copy.tradeDescriptionUsd}
        action={
          <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] font-medium text-muted">
            {latestYearLabel(language, exportsIndicator, importsIndicator)}
          </span>
        }
      />
      {rows.length === 0 ? (
        <ChartEmpty description={copy.tradeEmpty} />
      ) : (
        <>
          <div className="px-5 pt-4 sm:px-6">
            <ChartLegend
              items={[
                { label: copy.exports, color: "var(--chart-emerald)", shape: "bar" },
                { label: copy.imports, color: "var(--chart-blue)", shape: "bar" },
              ]}
            />
          </div>
          <div
            className="h-[280px] w-full px-2 pb-2 pt-3 sm:px-3"
            role="group"
            aria-label={copy.tradeAria(
              inBdt ? (language === "bn" ? "টাকার সমতুল্য" : "BDT equivalents") : (language === "bn" ? "মার্কিন ডলার" : "US dollars"),
            )}
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
                  tickFormatter={axisFormatter}
                />
                <Tooltip
                  wrapperStyle={chartTooltipWrapperStyle}
                  cursor={{ fill: "var(--chart-cursor)" }}
                  content={
                    <ChartTooltip
                      formatLabel={copy.tradeTooltip}
                      formatValue={(value) => formatExact(value)}
                    />
                  }
                />
                <Bar
                  dataKey="left"
                  name={copy.exportsName}
                  fill="var(--chart-emerald)"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="right"
                  name={copy.importsName}
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
              note={inBdt ? copy.tradeNoteBdt : copy.tradeNoteUsd}
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
  const copy = COPY[useLanguage()];
  const data = indicator?.observations ?? [];
  const latest = indicator?.latest;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={copy.gdpTitle}
        description={copy.gdpDescription}
        action={
          latest ? (
            <span className="font-mono text-[11px] font-semibold text-brand-strong">
              {formatPercent(latest.value, 2)} · {latest.year}
            </span>
          ) : null
        }
      />
      {data.length === 0 ? (
        <ChartEmpty title={copy.gdpUnavailable} />
      ) : (
        <>
          <div
            className="h-[230px] w-full px-2 pb-1 pt-4 sm:px-3"
            role="group"
            aria-label={copy.gdpAria}
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
                      formatLabel={copy.annualObservation}
                      formatValue={(value) => formatPercentPrecise(value)}
                    />
                  }
                />
                <Area
                  type="linear"
                  dataKey="value"
                  name={copy.gdpGrowthName}
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
              note={copy.annualRevised}
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
  const copy = COPY[useLanguage()];
  const data = indicator?.observations ?? [];
  const latest = indicator?.latest;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={copy.inflationTitle}
        description={copy.inflationDescription}
        action={
          latest ? (
            <span className="font-mono text-[11px] font-semibold text-amber">
              {formatPercent(latest.value, 2)} · {latest.year}
            </span>
          ) : null
        }
      />
      {data.length === 0 ? (
        <ChartEmpty title={copy.inflationUnavailable} />
      ) : (
        <>
          <div
            className="h-[230px] w-full px-2 pb-1 pt-4 sm:px-3"
            role="group"
            aria-label={copy.inflationAria}
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
                      formatLabel={copy.annualObservation}
                      formatValue={(value) => formatPercentPrecise(value)}
                    />
                  }
                />
                <Line
                  type="linear"
                  dataKey="value"
                  name={copy.cpiName}
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
              note={copy.annualRevised}
            />
          </div>
        </>
      )}
    </Panel>
  );
}
