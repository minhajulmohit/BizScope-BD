import type { AnalyticsData } from "@/lib/api/types";
import {
  formatIndicatorExact,
  formatIndicatorValue,
} from "@/lib/utils/format";
import { INDICATOR_DEFINITIONS, INDICATOR_ORDER } from "@/lib/indicator-catalog";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";

export function LatestObservations({
  analytics,
  inBdt,
}: {
  analytics: AnalyticsData;
  inBdt: boolean;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Latest available observations"
        description="The most recent non-null value for each series, with its actual observation year."
        action={
          <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
            {analytics.summary.availableIndicators}/{analytics.summary.totalIndicators}{" "}
            available
          </span>
        }
      />
      <div
        className="table-scroll overflow-x-auto scrollbar-subtle"
        role="region"
        aria-label="Latest available observations table"
        tabIndex={0}
      >
        <table className="w-full min-w-[620px] text-left text-[12px]">
          <caption className="sr-only">
            Latest available World Bank observations for Bangladesh
          </caption>
          <thead>
            <tr className="border-b border-line bg-surface-muted/60 text-[10px] uppercase tracking-[0.08em] text-subtle">
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                Indicator
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                Latest value
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Period
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {INDICATOR_ORDER.map((key) => {
              const definition = INDICATOR_DEFINITIONS[key];
              const indicator = analytics.indicators[key];
              const latest = indicator?.latest ?? null;

              return (
                <tr key={key} className="transition-colors hover:bg-surface-muted/40">
                  <th scope="row" className="px-5 py-3 font-medium text-foreground sm:px-6">
                    {definition.shortName}
                  </th>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular text-foreground"
                    title={
                      latest && indicator
                        ? formatIndicatorExact(indicator.unit, latest.value)
                        : undefined
                    }
                  >
                    {latest && indicator
                      ? formatIndicatorValue(indicator, latest.value)
                      : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {latest ? `Annual · ${latest.year}` : "No observation"}
                  </td>
                  <td className="px-5 py-3 text-muted sm:px-6">
                    <SourceLink
                      href={indicator?.source.sourceUrl ?? `https://data.worldbank.org/indicator/${definition.code}?locations=BD`}
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
        <p>Values are annual observations, not estimates for today.</p>
        <p>
          {inBdt
            ? "Money values are taka equivalents at the reference rate shown above."
            : "Money values are shown in their original US dollars because the taka reference rate is unavailable."}
        </p>
      </div>
    </Panel>
  );
}
