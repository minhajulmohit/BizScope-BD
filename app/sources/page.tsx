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
  ShieldCheck,
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
  "Every data provider, endpoint, indicator code, unit, update cadence, cache policy, licence, and limitation behind BizScope BD — including sources that are linked but not automatically integrated.";

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
    title: "Third-party FX feed",
    description:
      "Open ER-API supplies a daily reference snapshot. Cached for up to one hour; never presented as a live ticker or an official bank rate.",
    icon: RefreshCw,
  },
  {
    label: "Periodic official",
    title: "World Bank annual data",
    description:
      "Seven annual series, cached for six hours. Latest non-null observations carry their year; later revisions are possible.",
    icon: CalendarRange,
  },
  {
    label: "On-demand catalog",
    title: "OpenDataBD metadata",
    description:
      "Public catalog responses are cached for ten minutes. Dataset contents and download access are not mirrored.",
    icon: Database,
  },
  {
    label: "Manual access",
    title: "Bangladesh Bank, BBS, data.gov.bd",
    description:
      "Official HTML, PDF, Excel, or SDMX publications linked directly. No automatic ingestion or scraping is claimed.",
    icon: Landmark,
  },
];

const API_ENDPOINTS = [
  {
    path: "/api/analytics",
    description:
      "Normalised World Bank indicators, per-indicator errors, observation years, provider last-updated dates, and retrieval times.",
    parameters: "None",
    cache: "6-hour server data cache · HTTP s-maxage 6h",
    response: "200 for ok/partial; 503 when all indicators fail",
  },
  {
    path: "/api/currency",
    description:
      "Validated USD-based third-party rates, BDT rate, provider timestamps, attribution, and a sanitised error state.",
    parameters: "None",
    cache: "1-hour server data cache · provider updates daily",
    response: "200 for valid feed; 502 on feed failure",
  },
  {
    path: "/api/datasets",
    description:
      "OpenDataBD catalog proxy. Normalises dataset metadata and pagination and never proxies dataset file downloads.",
    parameters: "q (≤80 chars), category, page (1–1000), limit (1–24, default 12)",
    cache: "10-minute catalog cache · HTTP s-maxage 10m",
    response: "200 for valid catalog response; 502 on failure",
  },
  {
    path: "/api/status",
    description:
      "Health snapshot for the three integrated providers. Uses the same cached data functions as the dashboard.",
    parameters: "None",
    cache: "5-minute HTTP cache",
    response: "200 always, with provider-level health states",
  },
];

const CACHE_ROWS = [
  {
    source: "World Bank WDI",
    frequency: "Annual, periodically revised",
    appCache: "6 hours per indicator; 30-minute page revalidation",
    note: "Cache does not imply new provider observations. Observation year is always shown.",
  },
  {
    source: "Open ER-API",
    frequency: "Daily reference update",
    appCache: "1 hour; page revalidation every 30 minutes",
    note: "The next provider update time is displayed. Rates remain third-party, not official.",
  },
  {
    source: "OpenDataBD catalog",
    frequency: "On-demand catalog metadata",
    appCache: "10 minutes for catalog; 1 hour for platform stats",
    note: "Dataset files are not cached, proxied, or automatically downloaded.",
  },
  {
    source: "Bangladesh Bank / BBS / data.gov.bd",
    frequency: "Varies by publication",
    appCache: "Not applicable — no automated retrieval",
    note: "Official pages are linked directly for manual access.",
  },
];

const LIMITATIONS = [
  "World Bank values are annual and may lag the current calendar year. Every value is shown with its observation year, and an older annual observation is never relabelled as current.",
  "World Bank series can be revised after first publication. The application does not track historical revisions.",
  "Unemployment is a modeled ILO estimate, not a direct survey count for every year.",
  "Exports and imports cover goods and services in current US dollars. They are not merchandise-only customs figures and are not inflation-adjusted.",
  "The trade balance and export coverage ratio are derived calculations, shown only when both underlying values share the same year and definition.",
  "The currency feed provides current rates only. No historical exchange-rate chart is created from a single daily snapshot.",
  "Bangladesh Bank exchange-rate pages returned an interactive browser-verification screen during implementation, and no documented JSON endpoint was verified. Official rates are linked, not ingested.",
  "BBS and data.gov.bd are linked as official publication/directory sources. No public JSON API integration is claimed.",
  "OpenDataBD is a broad public catalog, not an economy-only dataset service. Its results vary in subject, format, licence, and access conditions.",
  "No database is required for this release; dashboard data is fetched and cached at the server layer rather than stored in MongoDB.",
];

export default async function SourcesPage() {
  const analytics = await getAnalyticsData();
  const hasErrors = analytics.status !== "ok";

  return (
    <div className="space-y-7 sm:space-y-8">
      <PageHeader
        eyebrow="Reference / Methodology"
        title="Sources & methodology"
        description="Exactly where every number comes from, how often it changes, how it is cached, and what this release does not claim. Integrations and manual links are labelled separately."
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Badge tone="brand">3 integrated sources</Badge>
          <Badge tone="outline">No real-time feeds</Badge>
        </div>
      </PageHeader>

      <DataNotice title="No real-time data is integrated.">
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
          ["#freshness", "Freshness model"],
          ["#health", "Provider health"],
          ["#providers", "Integrated sources"],
          ["#official-sources", "Official links"],
          ["#indicators", "Indicator codes"],
          ["#caching", "Caching"],
          ["#api", "Internal API"],
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
          <p className="eyebrow">Freshness model</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Four honest update classes
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
            title="Provider health"
            description="Last successful retrieval and current response state for each integrated source."
            action={
              <span className="inline-flex items-center gap-1 text-[10px] text-subtle">
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                Cached for 5 minutes
              </span>
            }
          />
          <SourceHealth />
        </Panel>
      </section>

      <section id="providers" className="scroll-mt-24 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Automatic integrations</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Sources the application actually fetches
            </h2>
          </div>
          <p className="max-w-md text-[10px] leading-4 text-subtle sm:text-right">
            These endpoints are called server-side with request timeouts and
            response-shape validation. Public API keys are not required.
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
          <p className="eyebrow">Manual access</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Official sources linked, not automated
          </h2>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted">
            These providers publish web pages, PDFs, spreadsheets, or SDMX
            datasets. They are included for authoritative follow-up and are not
            represented as live API integrations.
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
            title="World Bank indicator reference"
            description="The seven series used by the dashboard. All are annual, country-coded BGD, and requested with the latest ten non-null observations (mrnev=10)."
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
                World Bank indicator codes, units, frequency, and latest observation
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Indicator
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Unit
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Frequency
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Latest observation
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
                      <td className="px-4 py-3 font-mono text-[10px] text-muted">
                        {definition.code}
                      </td>
                      <td className="px-4 py-3 text-muted">{definition.unitLabel}</td>
                      <td className="px-4 py-3 text-muted">Annual</td>
                      <td className="px-4 py-3 text-muted">
                        {indicator?.latest ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="font-medium tabular text-foreground">
                              {indicator.latest.year}
                            </span>
                            <span className="text-[9px] text-subtle">non-null</span>
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
              Provider last updated: {formatUtcDate(analytics.summary.lastProviderUpdate)} ·
              Retrieval: {formatUtcDateTime(analytics.summary.lastSuccessfulRetrieval)}
            </p>
            {hasErrors ? (
              <p className="text-amber">
                Some series were unavailable at the last retrieval.
              </p>
            ) : (
              <p>All seven series loaded at the last cached retrieval.</p>
            )}
          </div>
        </Panel>
      </section>

      <section id="caching" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title="Caching and data freshness"
            description="Caching limits repeated upstream requests; it never makes a provider update more often than it actually does."
          />
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label="Caching and freshness table"
            tabIndex={0}
          >
            <table className="w-full min-w-[720px] text-left text-[11px]">
              <caption className="sr-only">Server caching and update frequency by provider</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Source
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Provider frequency
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Application cache
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Note
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
            If a provider fails, BizScope BD returns a sanitised error state and
            keeps successful indicators available. Failed responses are not cached
            as successful observations.
          </div>
        </Panel>
      </section>

      <section id="api" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title="Internal data API"
            description="Server route handlers used by the dashboard. They validate external responses and never expose upstream error bodies or secrets."
          />
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label="Internal API reference table"
            tabIndex={0}
          >
            <table className="w-full min-w-[840px] text-left text-[11px]">
              <caption className="sr-only">BizScope BD internal API endpoints</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Endpoint
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Parameters
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Cache
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Response behaviour
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {API_ENDPOINTS.map((endpoint) => (
                  <tr key={endpoint.path}>
                    <th scope="row" className="px-5 py-3.5 align-top sm:px-6">
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
                        GET {endpoint.path}
                      </code>
                      <p className="mt-1 max-w-xs text-[10px] font-normal leading-4 text-muted">
                        {endpoint.description}
                      </p>
                    </th>
                    <td className="px-4 py-3.5 align-top font-mono text-[9px] leading-4 text-muted">
                      {endpoint.parameters}
                    </td>
                    <td className="px-4 py-3.5 align-top text-[10px] leading-4 text-muted">
                      {endpoint.cache}
                    </td>
                    <td className="px-5 py-3.5 align-top text-[10px] leading-4 text-muted sm:px-6">
                      {endpoint.response}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section id="licensing" className="scroll-mt-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Licensing & attribution"
              description="Attribution requirements for each provider whose data is displayed."
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
                <p className="font-semibold text-foreground">ExchangeRate-API / Open ER-API</p>
                <p className="mt-0.5">
                  Rates are attributed to ExchangeRate-API and link to its provider
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
              description="What has actually been implemented and what happens when a provider fails."
              action={<ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" />}
            />
            <div className="space-y-3 p-5 text-[11px] leading-5 text-muted sm:p-6">
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>
                  The three integrated sources have working server-side fetchers
                  with documented or public endpoints. The provider health panel
                  above checks them independently.
                </span>
              </p>
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>
                  External payloads are shape-checked before use. Null values are
                  retained as missing, not converted into zeroes.
                </span>
              </p>
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>
                  Each World Bank indicator is cached independently, so one failed
                  series does not erase the others. Currency and catalog failures
                  have their own unavailable states.
                </span>
              </p>
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                <span>
                  The status endpoint reports provider-level health; it does not
                  guarantee that every individual observation is available.
                </span>
              </p>
              <div className="rounded-lg border border-line bg-surface-muted/60 px-3 py-2.5 text-[10px] leading-4">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Info className="h-3 w-3" aria-hidden="true" />
                  Read clearly:
                </span>{" "}
                Retail rates, exchange rates used for trade conversion, and a
                daily reference feed can differ. Check the official source for any
                regulated or financial decision.
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
