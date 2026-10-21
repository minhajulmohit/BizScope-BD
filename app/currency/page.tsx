import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { formatUtcDate, getCurrencyName } from "@/lib/utils/format";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { ErrorState } from "@/components/ui/states";
import { RetryButton } from "@/components/ui/retry-button";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SourceLink } from "@/components/ui/source-link";
import { Badge } from "@/components/ui/badge";
import { CurrencyWorkspace } from "@/components/currency/currency-workspace";

export const revalidate = 1800;

const PAGE_DESCRIPTION =
  "Convert USD to BDT and explore third-party daily reference exchange rates from Open ER-API, with clear attribution and separate links to Bangladesh Bank's official rates.";

export const metadata: Metadata = {
  title: "Currency & Exchange Rates",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "USD/BDT and currency reference rates",
    description: PAGE_DESCRIPTION,
  },
};

export default async function CurrencyPage() {
  const currency = await getCurrencyData();
  const currencyNames = Object.fromEntries(
    currency.rates.map((quote) => [quote.code, getCurrencyName(quote.code)]),
  );

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow="Currency / Reference rates"
        title="Currency & exchange rates"
        description="A USD-based currency converter and reference-rate table from a third-party daily feed. These are indicative reference rates — not Bangladesh Bank's official buying or selling rates."
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="daily" label="Daily third-party feed" />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            Updated · {formatUtcDate(currency.lastUpdatedUtc)}
          </span>
        </div>
      </PageHeader>

      <DataNotice
        tone="warning"
        title="Third-party reference data, not an official bank rate."
      >
        Open ER-API is an independent currency feed. Its values can differ from
        Bangladesh Bank&apos;s official rates and are not suitable for settlement,
        accounting, or regulatory decisions. The app validates the feed&apos;s
        status, currency codes, and numeric values before display.
      </DataNotice>

      {currency.status === "error" ? (
        <ErrorState
          title="Currency reference rates are unavailable"
          description="The third-party feed did not return a valid USD base or a usable BDT rate. No stale or substitute rate is shown. Official Bangladesh Bank links remain available below."
          action={<RetryButton label="Retry currency feed" />}
        />
      ) : (
        <CurrencyWorkspace data={currency} currencyNames={currencyNames} />
      )}

      <DataNotice tone="info" title="No historical exchange-rate chart is shown.">
        This provider endpoint supplies current rates only. BizScope BD does not
        invent a history or relabel the daily snapshot as a time series. For
        historical official rates, use Bangladesh Bank&apos;s published data.
      </DataNotice>

      <Panel>
        <PanelHeader
          title="Official Bangladesh Bank rates"
          description="The authoritative source for official exchange-rate publications."
          action={<Badge tone="outline">Not automated</Badge>}
        />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
          <div className="space-y-3 text-[12px] leading-6 text-muted">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-muted text-muted">
                <Landmark className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  Bangladesh Bank
                </p>
                <p className="text-[10px] text-subtle">
                  Central bank · official publications
                </p>
              </div>
            </div>
            <p>
              Bangladesh Bank publishes official exchange rates, the National
              Summary Data Page, reserves, remittance data, and other financial
              statistics as web pages and downloadable tables. Some pages require
              interactive browser verification, and no documented public JSON
              endpoint is available for automatic ingestion in this release.
            </p>
            <p>
              BizScope BD therefore links to the official pages rather than
              presenting them as a live API integration. The third-party rates
              above should always be checked against this source before any
              official use.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-background p-4">
            <SourceLink
              href="https://www.bb.org.bd/en/index.php/econdata/exchangerate"
              className="text-[12px] font-medium"
            >
              Bangladesh Bank exchange rates
            </SourceLink>
            <SourceLink
              href="https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php"
              className="text-[12px] font-medium"
            >
              National Summary Data Page
            </SourceLink>
            <SourceLink
              href="https://www.bb.org.bd/en/index.php/econdata/index"
              className="text-[12px] font-medium"
            >
              Bangladesh Bank open data
            </SourceLink>
            <p className="mt-1 border-t border-line pt-2 text-[10px] leading-4 text-subtle">
              Provided as official reference links. No automatic rate ingestion
              from these pages is claimed.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
