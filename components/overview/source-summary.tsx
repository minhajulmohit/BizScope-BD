import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type {
  AnalyticsData,
  CurrencyData,
  DatasetPlatformStats,
} from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";

type SourceStatus = "operational" | "degraded" | "unavailable" | "linked";

const STATUS_CONFIG: Record<SourceStatus, { dot: string; label: string; text: string }> = {
  operational: { dot: "bg-brand", label: "Responding", text: "text-brand-strong" },
  degraded: { dot: "bg-amber", label: "Degraded", text: "text-amber" },
  unavailable: { dot: "bg-danger", label: "Unavailable", text: "text-danger" },
  linked: { dot: "bg-subtle", label: "Official link", text: "text-muted" },
};

interface SourceRow {
  name: string;
  role: string;
  status: SourceStatus;
  detail: string;
  href: string;
}

export function SourceSummary({
  analytics,
  currency,
  datasetStats,
}: {
  analytics: AnalyticsData;
  currency: CurrencyData;
  datasetStats: DatasetPlatformStats | null;
}) {
  const worldBankStatus: SourceStatus =
    analytics.status === "ok"
      ? "operational"
      : analytics.status === "partial"
        ? "degraded"
        : "unavailable";

  const currencyStatus: SourceStatus =
    currency.status === "ok" ? "operational" : "unavailable";

  const catalogStatus: SourceStatus =
    datasetStats !== null ? "operational" : "unavailable";

  const rows: SourceRow[] = [
    {
      name: "World Bank WDI",
      role: "Macro & trade statistics",
      status: worldBankStatus,
      detail: `${analytics.summary.availableIndicators}/${analytics.summary.totalIndicators} indicators loaded`,
      href: "https://data.worldbank.org/country/bangladesh",
    },
    {
      name: "Open ER-API",
      role: "Third-party FX reference",
      status: currencyStatus,
      detail:
        currency.status === "ok"
          ? "Daily USD feed responding"
          : "Reference feed unavailable",
      href: currency.source.homepageUrl,
    },
    {
      name: "OpenDataBD",
      role: "Public dataset catalog",
      status: catalogStatus,
      detail: datasetStats
        ? `${datasetStats.totalDatasets} datasets in catalog`
        : "Catalog status unavailable",
      href: "https://opendatabd.com/",
    },
    {
      name: "Bangladesh Bank",
      role: "Official monetary data",
      status: "linked",
      detail: "Manual official source",
      href: "https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php",
    },
    {
      name: "BBS",
      role: "Official national statistics",
      status: "linked",
      detail: "Reports & publications",
      href: "https://bbs.gov.bd/",
    },
  ];

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Data sources"
        description="Three integrations, plus official sources linked for manual access."
      />
      <ul className="divide-y divide-line">
        {rows.map((row) => {
          const config = STATUS_CONFIG[row.status];

          return (
            <li key={row.name} className="flex items-start gap-3 px-5 py-3 sm:px-6">
              <span
                className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", config.dot)}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[12px] font-semibold text-foreground">
                    {row.name}
                  </p>
                  <span className={cn("text-[9px] font-semibold uppercase tracking-[0.06em]", config.text)}>
                    {config.label}
                  </span>
                </div>
                <p className="text-[10px] text-subtle">{row.role}</p>
                <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-muted">{row.detail}</p>
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-sm text-[10px] text-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    Source
                    <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-6">
        <p className="text-[10px] text-subtle">
          No real-time feeds are claimed.
        </p>
        <Link
          href="/sources"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Methodology
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </Panel>
  );
}
