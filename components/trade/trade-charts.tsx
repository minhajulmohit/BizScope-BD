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
import { useLanguage } from "@/components/language-provider";

const MARGIN = { top: 10, right: 10, left: -2, bottom: 0 };
const AXIS_TICK = { fill: "var(--chart-axis)", fontSize: 10 } as const;

const COPY = {
  en: {
    sourceUpdated: (date: string) => ` · source updated ${date}`,
    conversionBdt: (rate: string, date: string) =>
      `Taka equivalents at 1 USD = ৳${rate}${date ? ` (${date})` : ""}.`,
    conversionUsd:
      "Shown in the source currency because the taka reference rate is unavailable.",
    flowsTitle: "Exports vs imports over time",
    flowsDescription: (note: string) => `Goods and services. ${note}`,
    annualPeriods: (count: number) => `${count} annual periods`,
    noTrade: "No World Bank trade observations are available.",
    exports: "Exports of goods & services",
    imports: "Imports of goods & services",
    flowsAria: (unit: string) =>
      `Grouped bar chart of annual Bangladesh exports and imports of goods and services in ${unit}.`,
    tradeFlows: (label: string | number | undefined) =>
      `Annual trade flows · ${String(label ?? "")}`,
    flowsNote: "Goods and services only — not merchandise-only customs trade.",
    balanceTitle: "Trade balance",
    balanceDescription: (note: string) =>
      `Exports minus imports, same definition and period. ${note}`,
    comparableYears: (count: number) => `${count} comparable years`,
    balanceEmptyTitle: "Balance cannot be calculated",
    balanceEmptyDescription:
      "A trade balance requires both the exports and imports series for the same annual period. This dashboard does not substitute another trade definition.",
    surplus: "Surplus",
    deficit: "Deficit",
    balanceAria: (unit: string) =>
      `Diverging bar chart of Bangladesh's annual goods and services trade balance in ${unit}.`,
    balanceTooltip: (label: string | number | undefined) =>
      `Calculated trade balance · ${String(label ?? "")}`,
    deficitLabel: "deficit",
    surplusLabel: "surplus",
    balanceName: "Exports minus imports",
    balanceNote: "Calculated, not a source-published balance.",
    bdtUnit: "BDT equivalents",
    usdUnit: "US dollars",
  },
  bn: {
    sourceUpdated: (date: string) => ` · উৎস হালনাগাদ ${date}`,
    conversionBdt: (rate: string, date: string) =>
      `১ মার্কিন ডলার = ৳${rate} হারে টাকার সমতুল্য${date ? ` (${date})` : ""}।`,
    conversionUsd:
      "টাকার রেফারেন্স হার পাওয়া যায়নি, তাই উৎসের মুদ্রায় দেখানো হচ্ছে।",
    flowsTitle: "সময়ের সঙ্গে রপ্তানি বনাম আমদানি",
    flowsDescription: (note: string) => `পণ্য ও সেবা। ${note}`,
    annualPeriods: (count: number) => `${count}টি বার্ষিক সময়কাল`,
    noTrade: "বিশ্বব্যাংকের কোনো বাণিজ্য পর্যবেক্ষণ পাওয়া যাচ্ছে না।",
    exports: "পণ্য ও সেবা রপ্তানি",
    imports: "পণ্য ও সেবা আমদানি",
    flowsAria: (unit: string) =>
      `বার্ষিক বাংলাদেশের পণ্য ও সেবা রপ্তানি ও আমদানির গ্রুপড বার চার্ট, ${unit}-এ।`,
    tradeFlows: (label: string | number | undefined) =>
      `বার্ষিক বাণিজ্য প্রবাহ · ${String(label ?? "")}`,
    flowsNote:
      "শুধু পণ্য ও সেবা—শুধু পণ্যের কাস্টমস বাণিজ্য নয়।",
    balanceTitle: "বাণিজ্য ভারসাম্য",
    balanceDescription: (note: string) =>
      `রপ্তানি থেকে আমদানি বাদ, একই সংজ্ঞা ও সময়কালে। ${note}`,
    comparableYears: (count: number) => `${count}টি তুলনাযোগ্য বছর`,
    balanceEmptyTitle: "ভারসাম্য হিসাব করা যাচ্ছে না",
    balanceEmptyDescription:
      "বাণিজ্য ভারসাম্যের জন্য একই বার্ষিক সময়কালের রপ্তানি ও আমদানি—দুটো সিরিজই দরকার। এই ড্যাশবোর্ড অন্য কোনো বাণিজ্য সংজ্ঞা বসায় না।",
    surplus: "উদ্বৃত্ত",
    deficit: "ঘাটতি",
    balanceAria: (unit: string) =>
      `বাংলাদেশের বার্ষিক পণ্য ও সেবা বাণিজ্য ভারসাম্যের ডাইভার্জিং বার চার্ট, ${unit}-এ।`,
    balanceTooltip: (label: string | number | undefined) =>
      `হিসাব করা বাণিজ্য ভারসাম্য · ${String(label ?? "")}`,
    deficitLabel: "ঘাটতি",
    surplusLabel: "উদ্বৃত্ত",
    balanceName: "রপ্তানি থেকে আমদানি বাদ",
    balanceNote: "হিসাব করা, উৎসে প্রকাশিত ভারসাম্য নয়।",
    bdtUnit: "টাকার সমতুল্য",
    usdUnit: "মার্কিন ডলার",
  },
};

function ChartSourceFooter({
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
  const language = useLanguage();
  const copy = COPY[language];
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
      ? copy.conversionBdt(
          formatRate(bdtPerUsd),
          bdtUpdatedAt ? formatUtcDate(bdtUpdatedAt) : "",
        )
      : copy.conversionUsd;
  const unitLabel = inBdt ? copy.bdtUnit : copy.usdUnit;

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel className="flex min-w-0 flex-col xl:col-span-2">
        <PanelHeader
          title={copy.flowsTitle}
          description={copy.flowsDescription(conversionNote)}
          action={
            <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
              {copy.annualPeriods(series.length)}
            </span>
          }
        />
        {!hasFlows ? (
          <ChartEmpty description={copy.noTrade} />
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
              className="h-[320px] w-full px-2 pb-2 pt-4 sm:h-[350px] sm:px-3"
              role="group"
              aria-label={copy.flowsAria(unitLabel)}
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
                        formatLabel={copy.tradeFlows}
                        formatValue={(value) => formatExact(value)}
                      />
                    }
                  />
                  <Bar
                    dataKey="exports"
                    name={copy.exports}
                    fill="var(--chart-emerald)"
                    radius={[3, 3, 0, 0]}
                    barSize={13}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="imports"
                    name={copy.imports}
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
                note={copy.flowsNote}
              />
            </div>
          </>
        )}
      </Panel>

      <Panel className="flex min-w-0 flex-col">
        <PanelHeader
          title={copy.balanceTitle}
          description={copy.balanceDescription(conversionNote)}
          action={
            hasBalance ? (
              <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
                {copy.comparableYears(comparable.length)}
              </span>
            ) : null
          }
        />
        {!hasBalance ? (
          <ChartEmpty
            title={copy.balanceEmptyTitle}
            description={copy.balanceEmptyDescription}
          />
        ) : (
          <>
            <div className="px-5 pt-4 sm:px-6">
              <ChartLegend
                items={[
                  { label: copy.surplus, color: "var(--chart-emerald)", shape: "bar" },
                  { label: copy.deficit, color: "var(--chart-blue)", shape: "bar" },
                ]}
              />
            </div>
            <div
              className="h-[320px] w-full px-2 pb-2 pt-4 sm:h-[350px] sm:px-3"
              role="group"
              aria-label={copy.balanceAria(unitLabel)}
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
                        formatLabel={copy.balanceTooltip}
                        formatValue={(value) =>
                          `${formatExact(value)} ${
                            value < 0
                              ? `(${copy.deficitLabel})`
                              : value > 0
                                ? `(${copy.surplusLabel})`
                                : ""
                          }`.trim()
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="balance"
                    name={copy.balanceName}
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
                note={copy.balanceNote}
              />
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
