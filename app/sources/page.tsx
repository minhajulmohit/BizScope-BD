import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenText,
  CalendarRange,
  Clock3,
  Database,
  Info,
  Landmark,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAnalyticsData } from "@/lib/api/world-bank";
import { SOURCE_REGISTRY } from "@/lib/sources";
import { INDICATOR_DEFINITIONS, INDICATOR_ORDER } from "@/lib/indicator-catalog";
import {
  formatUtcDate,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/ui/source-link";
import { SourceHealth } from "@/components/source-health";
import { SourceCard } from "@/components/sources/source-card";

export const revalidate = 1800;

const PAGE_DESCRIPTION =
  "Where every number in BizScope BD comes from, how often it changes, and what the dashboard does and does not claim — including official sources that are linked rather than copied automatically.";

export const metadata: Metadata = {
  title: "Sources & Methodology",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "BizScope BD sources & methodology",
    description: PAGE_DESCRIPTION,
  },
};

const INTEGRATED_SOURCES = SOURCE_REGISTRY.filter(
  (source) => source.integration === "integrated",
);
const MANUAL_SOURCES = SOURCE_REGISTRY.filter(
  (source) => source.integration !== "integrated",
);

const FRESHNESS_TIERS: Array<{
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    label: "Daily reference",
    title: "Currency reference rates",
    description:
      "ExchangeRate-API provides one reference update each day. We keep a short-term copy so pages load quickly; it is not a live ticker or an official bank rate.",
    icon: RefreshCw,
  },
  {
    label: "Annual official",
    title: "World Bank statistics",
    description:
      "Seven yearly series, checked at most every six hours. Every value shows its observation year, and earlier years can be revised.",
    icon: CalendarRange,
  },
  {
    label: "Public catalog",
    title: "OpenDataBD dataset listings",
    description:
      "Catalog details are checked at most every ten minutes. Dataset files and download access are not copied or stored.",
    icon: Database,
  },
  {
    label: "Official links",
    title: "Bangladesh Bank, BBS, data.gov.bd",
    description:
      "Official websites are linked directly. Nothing is copied, scraped, or presented as an automatic feed.",
    icon: Landmark,
  },
];

const CACHE_ROWS = [
  {
    source: "World Bank WDI",
    frequency: "Once a year, with revisions",
    appCache: "At most every 6 hours",
    note: "A check does not mean new data. The observation year is always shown.",
  },
  {
    source: "ExchangeRate-API",
    frequency: "Usually once a day",
    appCache: "At most every hour",
    note: "The next update time is displayed. Rates are third-party, not official.",
  },
  {
    source: "OpenDataBD catalog",
    frequency: "Changes as datasets are published",
    appCache: "At most every 10 minutes for listings; 1 hour for totals",
    note: "Dataset files are not copied, stored, or downloaded.",
  },
  {
    source: "Bangladesh Bank / BBS / data.gov.bd",
    frequency: "Varies by publication",
    appCache: "Not checked automatically",
    note: "Official pages are linked for you to visit directly.",
  },
];

const LIMITATIONS = [
  "World Bank values are annual and may lag the current calendar year. Every value is shown with its observation year, and an older annual observation is never relabelled as current.",
  "World Bank series can be revised after first publication. The dashboard does not track historical revisions.",
  "Unemployment is a modeled ILO estimate, not a direct survey count for every year.",
  "The World Bank publishes exports and imports in US dollars. The dashboard converts them to BDT at the current reference rate. They cover goods and services, not merchandise-only customs figures, and are not adjusted for inflation.",
  "The trade balance and export coverage ratio are derived calculations, shown only when both underlying values share the same year and definition.",
  "The currency service provides current rates only. No historical exchange-rate chart is created from a single daily snapshot.",
  "Bangladesh Bank's exchange-rate pages required a browser check during implementation, so official rates are linked rather than copied automatically.",
  "BBS and data.gov.bd are linked as official publication and directory sources. The dashboard does not claim an automatic feed from either.",
  "OpenDataBD is a broad public catalog, not an economy-only dataset service. Its results vary in subject, format, licence, and access conditions.",
  "This release does not keep its own database of the underlying datasets. Data is read from the sources when needed and held only briefly to keep pages fast.",
];

export default async function SourcesPage() {
  const analytics = await getAnalyticsData();
  const hasErrors = analytics.status !== "ok";

  return (
    <div className="space-y-7 sm:space-y-8">
      <PageHeader
        eyebrow="Reference / Methodology"
        title="Sources & methodology"
        description="Where every number comes from, how often it changes, and what this release does not claim. Automatic connections and official links are labelled separately."
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Badge tone="brand">3 connected sources</Badge>
          <Badge tone="outline">No real-time data</Badge>
        </div>
      </PageHeader>

      <DataNotice title="No real-time data is included.">
        BizScope BD contains a daily third-party currency reference, annual
        periodically revised World Bank statistics, and an on-demand public
        dataset catalog. Nothing on this dashboard is a live market quote or a
        real-time official statistic.
      </DataNotice>

      <nav
        aria-label="On this page"
        className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3 text-[11px]"
      >
        {[
          ["#freshness", "Update types"],
          ["#health", "Source status"],
          ["#providers", "Connected sources"],
          ["#official-sources", "Official links"],
          ["#indicators", "The seven indicators"],
          ["#caching", "Update checks"],
          ["#licensing", "Licensing"],
          ["#limitations", "Limitations"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="text-muted underline decoration-line-strong underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="freshness" className="scroll-mt-24 space-y-3">
        <div>
          <p className="eyebrow">Update types</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Four kinds of data freshness
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {FRESHNESS_TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.label}
                className="rounded-card border border-line bg-surface p-4 shadow-card"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-muted text-muted">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.09em] text-subtle">
                  {tier.label}
                </p>
                <h3 className="mt-0.5 text-[12px] font-semibold text-foreground">
                  {tier.title}
                </h3>
                <p className="mt-1.5 text-[10px] leading-4 text-muted">{tier.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="health" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title="Source status"
            description="Last successful check and current state for each connected source."
            action={
              <span className="inline-flex items-center gap-1 text-[10px] text-subtle">
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                Checked every 5 minutes
              </span>
            }
          />
          <SourceHealth />
        </Panel>
      </section>

      <section id="providers" className="scroll-mt-24 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Connected automatically</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Sources the dashboard reads for you
            </h2>
          </div>
          <p className="max-w-md text-[10px] leading-4 text-subtle sm:text-right">
            We check these sources on the server, with timeouts, and only use
            responses that pass our checks. No account or key is needed.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {INTEGRATED_SOURCES.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section id="official-sources" className="scroll-mt-24 space-y-3">
        <div>
          <p className="eyebrow">Official links</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Official sources linked, not copied automatically
          </h2>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted">
            These organizations publish web pages, PDFs, spreadsheets, or data
            catalogs. They are included for authoritative follow-up. We do not
            claim an automatic feed from them.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MANUAL_SOURCES.map((source) => (
            <SourceCard key={source.id} source={source} compact />
          ))}
        </div>
      </section>

      <section id="indicators" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title="The seven World Bank indicators"
            description="All are yearly and cover Bangladesh. Where the World Bank publishes in US dollars, the dashboard shows a BDT equivalent at the current reference rate."
            action={
              <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
                {analytics.summary.availableIndicators}/{analytics.summary.totalIndicators} available
              </span>
            }
          />
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label="World Bank indicator reference table"
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] text-left text-[11px]">
              <caption className="sr-only">
                World Bank indicators, units shown, frequency, latest observation
                year, and source
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Indicator
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Unit shown
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Frequency
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Latest year
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
                  return (
                    <tr key={key} className="transition-colors hover:bg-surface-muted/40">
                      <th scope="row" className="px-5 py-3 font-medium text-foreground sm:px-6">
                        {definition.shortName}
                      </th>
                      <td className="px-4 py-3 text-muted">
                        {definition.unit === "usd" ? "BDT equivalent" : definition.unitLabel}
                      </td>
                      <td className="px-4 py-3 text-muted">Yearly</td>
                      <td className="px-4 py-3 text-muted">
                        {indicator?.latest ? (
                          <span className="font-medium tabular text-foreground">
                            {indicator.latest.year}
                          </span>
                        ) : (
                          "\u2014"
                        )}
                      </td>
                      <td className="px-5 py-3 sm:px-6">
                        <SourceLink
                          href={
                            indicator?.source.sourceUrl ??
                            `https://data.worldbank.org/indicator/${definition.code}?locations=BD`
                          }
                          className="text-[10px]"
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[10px] text-subtle sm:px-6">
            <p>
              World Bank last updated: {formatUtcDate(analytics.summary.lastProviderUpdate)} ·
              Last checked by BizScope: {formatUtcDateTime(analytics.summary.lastSuccessfulRetrieval)}
            </p>
            {hasErrors ? (
              <p className="text-amber">
                Some series were unavailable at the last check.
              </p>
            ) : (
              <p>All seven series loaded at the last check.</p>
            )}
          </div>
        </Panel>
      </section>

      <section id="caching" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title="How often we check for updates"
            description="Checking more often does not make a source publish new data. Observation years and update times are always shown."
          />
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label="Update check frequency table"
            tabIndex={0}
          >
            <table className="w-full min-w-[720px] text-left text-[11px]">
              <caption className="sr-only">Update frequency and check interval by source</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Source
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    How often it changes
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    How often we check
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    What this means
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {CACHE_ROWS.map((row) => (
                  <tr key={row.source}>
                    <th scope="row" className="px-5 py-3 font-medium text-foreground sm:px-6">
                      {row.source}
                    </th>
                    <td className="px-4 py-3 text-muted">{row.frequency}</td>
                    <td className="px-4 py-3 text-muted">{row.appCache}</td>
                    <td className="px-5 py-3 text-[10px] text-subtle sm:px-6">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-5 py-3 text-[10px] leading-4 text-subtle sm:px-6">
            If a source is unavailable, we say so and keep the sources that did
            work. An old value is never presented as a fresh one.
          </div>
        </Panel>
      </section>

      <section id="licensing" className="scroll-mt-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Licensing & attribution"
              description="Credit and usage terms for each source."
            />
            <div className="space-y-4 p-5 text-[11px] leading-5 text-muted sm:p-6">
              <div>
                <p className="font-semibold text-foreground">World Bank</p>
                <p className="mt-0.5">
                  World Development Indicators are made available under the
                  Creative Commons Attribution 4.0 licence (CC BY 4.0). Charts and
                  tables link to the World Bank indicator pages.{" "}
                  <SourceLink
                    href="https://datacatalog.worldbank.org/public-licenses"
                    className="text-[10px]"
                  >
                    Licence
                  </SourceLink>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">ExchangeRate-API</p>
                <p className="mt-0.5">
                  Rates are credited to ExchangeRate-API and link to its source
                  page and terms. This application does not present them as official
                  Bangladesh Bank rates.{" "}
                  <SourceLink
                    href="https://www.exchangerate-api.com/terms"
                    className="text-[10px]"
                  >
                    Terms
                  </SourceLink>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">OpenDataBD</p>
                <p className="mt-0.5">
                  Dataset metadata is shown with its own licence when available.
                  Licences and access conditions vary by record and remain the
                  responsibility of the dataset publisher. BizScope BD does not
                  redistribute dataset files.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Bangladesh Bank &amp; BBS</p>
                <p className="mt-0.5">
                  Official publications are linked to their source pages. Reuse of
                  those publications is subject to the publisher&apos;s terms.
                </p>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Verification & failure behaviour"
              description="What happens when a source is slow or unavailable."
            />
            <div className="space-y-3 p-5 text-[11px] leading-5 text-muted sm:p-6">
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>
                  The three connected sources are checked by the dashboard. The
                  source status panel above shows their current state.
                </span>
              </p>
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>
                  We check the shape of each response before using it. Missing
                  values stay missing and are never turned into zero.
                </span>
              </p>
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>
                  Each World Bank series loads separately, so one failure does not
                  erase the others. Currency and catalog failures get their own
                  unavailable message.
                </span>
              </p>
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                <span>
                  The status check reports whether a source is responding; it
                  cannot guarantee that every individual observation exists.
                </span>
              </p>
              <div className="rounded-lg border border-line bg-surface-muted/60 px-3 py-2.5 text-[10px] leading-4">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Info className="h-3 w-3" aria-hidden="true" />
                  Read clearly:
                </span>{" "}
                Retail rates, official bank rates, and the reference rate used here
                can differ. Check the official source for any regulated or
                financial decision.
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section id="limitations" className="scroll-mt-24 scroll-mb-10">
        <Panel>
          <PanelHeader
            title="Known limitations"
            description="Stated up front so the dashboard is not mistaken for something it is not."
            action={<BookOpenText className="h-4 w-4 text-subtle" aria-hidden="true" />}
          />
          <ul className="grid gap-x-8 gap-y-3 p-5 text-[11px] leading-5 text-muted sm:p-6 lg:grid-cols-2">
            {LIMITATIONS.map((limitation) => (
              <li key={limitation} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[10px] text-subtle sm:px-6">
            <p>
              Questions about a value? Start with the source link on its card or
              table row.
            </p>
            <Link
              href="/"
              className="font-medium text-muted underline underline-offset-2 hover:text-foreground"
            >
              Back to overview
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
