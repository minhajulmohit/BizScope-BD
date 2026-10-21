import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type {
  AnalyticsData,
  CurrencyData,
  DatasetPlatformStats,
} from "@/lib/api/types";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";

type SourceStatus = "operational" | "degraded" | "unavailable" | "linked";

const STATUS_CONFIG: Record<
  SourceStatus,
  { dot: string; label: { en: string; bn: string }; text: string }
> = {
  operational: {
    dot: "bg-brand",
    label: { en: "Responding", bn: "সাড়া দিচ্ছে" },
    text: "text-brand-strong",
  },
  degraded: {
    dot: "bg-amber",
    label: { en: "Limited", bn: "সীমিত" },
    text: "text-amber",
  },
  unavailable: {
    dot: "bg-danger",
    label: { en: "Unavailable", bn: "অনুপলব্ধ" },
    text: "text-danger",
  },
  linked: {
    dot: "bg-subtle",
    label: { en: "Official link", bn: "সরকারি লিংক" },
    text: "text-muted",
  },
};

const COPY = {
  en: {
    title: "Data sources",
    description:
      "Three connected sources, plus official sources linked for manual reference.",
    worldBankRole: "Macro & trade statistics",
    worldBankDetail: (available: number, total: number) =>
      `${available}/${total} indicators loaded`,
    currencyRole: "Daily currency reference",
    currencyAvailable: "Dollar–taka reference available",
    currencyUnavailable: "Daily reference unavailable",
    catalogRole: "Public dataset catalog",
    catalogDetail: (total: number) => `${total} datasets in catalog`,
    catalogUnavailable: "Catalog status unavailable",
    bangladeshBankRole: "Official monetary data",
    bangladeshBankDetail: "Official website link",
    bbsRole: "Official national statistics",
    bbsDetail: "Reports & publications",
    source: "Source",
    noRealtime: "No real-time data is claimed.",
    methodology: "Methodology",
  },
  bn: {
    title: "ডেটার উৎস",
    description:
      "তিনটি সংযুক্ত উৎস, সঙ্গে ম্যানুয়াল রেফারেন্সের জন্য সরকারি উৎসের লিংক।",
    worldBankRole: "ম্যাক্রো ও বাণিজ্য পরিসংখ্যান",
    worldBankDetail: (available: number, total: number) =>
      `${total}টির মধ্যে ${available}টি সূচক লোড হয়েছে`,
    currencyRole: "দৈনিক মুদ্রা রেফারেন্স",
    currencyAvailable: "ডলার–টাকার রেফারেন্স পাওয়া গেছে",
    currencyUnavailable: "দৈনিক রেফারেন্স পাওয়া যাচ্ছে না",
    catalogRole: "সর্বজনীন ডেটাসেট ক্যাটালগ",
    catalogDetail: (total: number) => `ক্যাটালগে ${total}টি ডেটাসেট`,
    catalogUnavailable: "ক্যাটালগের অবস্থা পাওয়া যাচ্ছে না",
    bangladeshBankRole: "সরকারি মুদ্রা ডেটা",
    bangladeshBankDetail: "সরকারি ওয়েবসাইটের লিংক",
    bbsRole: "সরকারি জাতীয় পরিসংখ্যান",
    bbsDetail: "প্রতিবেদন ও প্রকাশনা",
    source: "উৎস",
    noRealtime: "কোনো রিয়েল-টাইম ডেটার দাবি করা হয় না।",
    methodology: "পদ্ধতি",
  },
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
  language,
}: {
  analytics: AnalyticsData;
  currency: CurrencyData;
  datasetStats: DatasetPlatformStats | null;
  language: Language;
}) {
  const copy = COPY[language];
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
      role: copy.worldBankRole,
      status: worldBankStatus,
      detail: copy.worldBankDetail(
        analytics.summary.availableIndicators,
        analytics.summary.totalIndicators,
      ),
      href: "https://data.worldbank.org/country/bangladesh",
    },
    {
      name: "ExchangeRate-API",
      role: copy.currencyRole,
      status: currencyStatus,
      detail:
        currency.status === "ok"
          ? copy.currencyAvailable
          : copy.currencyUnavailable,
      href: currency.source.homepageUrl,
    },
    {
      name: "OpenDataBD",
      role: copy.catalogRole,
      status: catalogStatus,
      detail: datasetStats
        ? copy.catalogDetail(datasetStats.totalDatasets)
        : copy.catalogUnavailable,
      href: "https://opendatabd.com/",
    },
    {
      name: "Bangladesh Bank",
      role: copy.bangladeshBankRole,
      status: "linked",
      detail: copy.bangladeshBankDetail,
      href: "https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php",
    },
    {
      name: "BBS",
      role: copy.bbsRole,
      status: "linked",
      detail: copy.bbsDetail,
      href: "https://bbs.gov.bd/",
    },
  ];

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={copy.title} description={copy.description} />
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
                  <span
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-[0.06em]",
                      config.text,
                    )}
                  >
                    {config.label[language]}
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
                    {copy.source}
                    <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    <span className="sr-only">
                      {language === "bn" ? "(নতুন ট্যাবে খুলবে)" : "(opens in a new tab)"}
                    </span>
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-6">
        <p className="text-[10px] text-subtle">{copy.noRealtime}</p>
        <Link
          href="/sources"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {copy.methodology}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </Panel>
  );
}
