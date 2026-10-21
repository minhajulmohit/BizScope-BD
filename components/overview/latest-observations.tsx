import type { AnalyticsData } from "@/lib/api/types";
import type { Language } from "@/lib/i18n";
import {
  formatIndicatorExact,
  formatIndicatorValue,
} from "@/lib/utils/format";
import { INDICATOR_DEFINITIONS, INDICATOR_ORDER } from "@/lib/indicator-catalog";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";

const COPY = {
  en: {
    title: "Latest available observations",
    description:
      "The most recent non-null value for each series, with its actual observation year.",
    available: (available: number, total: number) =>
      `${available}/${total} available`,
    tableLabel: "Latest available observations table",
    caption: "Latest available World Bank observations for Bangladesh",
    indicator: "Indicator",
    latestValue: "Latest value",
    period: "Period",
    source: "Source",
    noObservation: "No observation",
    footer: "Values are annual observations, not estimates for today.",
    inBdt:
      "Money values are taka equivalents at the reference rate shown above.",
    fallback:
      "Money values are shown in their original US dollars because the taka reference rate is unavailable.",
    annual: (year: number) => `Annual · ${year}`,
  },
  bn: {
    title: "সর্বশেষ পাওয়া পর্যবেক্ষণ",
    description:
      "প্রতিটি সিরিজের সর্বশেষ শূন্য-নয় এমন মান, সঙ্গে তার প্রকৃত পর্যবেক্ষণ বছর।",
    available: (available: number, total: number) =>
      `${total}টির মধ্যে ${available}টি পাওয়া গেছে`,
    tableLabel: "সর্বশেষ পাওয়া পর্যবেক্ষণের টেবিল",
    caption: "বাংলাদেশের জন্য বিশ্বব্যাংকের সর্বশেষ পাওয়া পর্যবেক্ষণ",
    indicator: "সূচক",
    latestValue: "সর্বশেষ মান",
    period: "সময়কাল",
    source: "উৎস",
    noObservation: "কোনো পর্যবেক্ষণ নেই",
    footer: "মানগুলো বার্ষিক পর্যবেক্ষণ, আজকের জন্য অনুমান নয়।",
    inBdt: "অর্থসংক্রান্ত মান উপরের রেফারেন্স হার ব্যবহার করা টাকার সমতুল্য।",
    fallback:
      "টাকার রেফারেন্স হার পাওয়া যায়নি, তাই অর্থসংক্রান্ত মান মূল মার্কিন ডলারেই দেখানো হচ্ছে।",
    annual: (year: number) => `বার্ষিক · ${year}`,
  },
};

export function LatestObservations({
  analytics,
  inBdt,
  language,
}: {
  analytics: AnalyticsData;
  inBdt: boolean;
  language: Language;
}) {
  const copy = COPY[language];

  return (
    <Panel>
      <PanelHeader
        title={copy.title}
        description={copy.description}
        action={
          <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
            {copy.available(
              analytics.summary.availableIndicators,
              analytics.summary.totalIndicators,
            )}
          </span>
        }
      />
      <div
        className="table-scroll overflow-x-auto scrollbar-subtle"
        role="region"
        aria-label={copy.tableLabel}
        tabIndex={0}
      >
        <table className="w-full min-w-[620px] text-left text-[12px]">
          <caption className="sr-only">{copy.caption}</caption>
          <thead>
            <tr className="border-b border-line bg-surface-muted/60 text-[10px] uppercase tracking-[0.08em] text-subtle">
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                {copy.indicator}
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                {copy.latestValue}
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                {copy.period}
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                {copy.source}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {INDICATOR_ORDER.map((key) => {
              const definition = INDICATOR_DEFINITIONS[key];
              const definitionCopy =
                language === "bn" ? definition.bn : definition;
              const indicator = analytics.indicators[key];
              const latest = indicator?.latest ?? null;

              return (
                <tr key={key} className="transition-colors hover:bg-surface-muted/40">
                  <th scope="row" className="px-5 py-3 font-medium text-foreground sm:px-6">
                    {definitionCopy.shortName}
                  </th>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular text-foreground"
                    title={
                      latest && indicator
                        ? formatIndicatorExact(
                            indicator.unit,
                            latest.value,
                            language,
                          )
                        : undefined
                    }
                  >
                    {latest && indicator
                      ? formatIndicatorValue(indicator, latest.value)
                      : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {latest ? copy.annual(latest.year) : copy.noObservation}
                  </td>
                  <td className="px-5 py-3 text-muted sm:px-6">
                    <SourceLink
                      href={
                        indicator?.source.sourceUrl ??
                        `https://data.worldbank.org/indicator/${definition.code}?locations=BD`
                      }
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
        <p>{copy.footer}</p>
        <p>{inBdt ? copy.inBdt : copy.fallback}</p>
      </div>
    </Panel>
  );
}
