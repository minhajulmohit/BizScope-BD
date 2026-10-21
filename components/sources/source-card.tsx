import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Database,
  Landmark,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import type { SourceRegistryEntry } from "@/lib/api/types";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { SourceLink } from "@/components/ui/source-link";

const COPY = {
  en: {
    connected: "Connected",
    officialLink: "Official link",
    where: "Where to find it",
    updateNotes: "Update notes",
    usage: "Usage terms:",
    visit: "Visit source website",
  },
  bn: {
    connected: "সংযুক্ত",
    officialLink: "সরকারি লিংক",
    where: "কোথায় পাবেন",
    updateNotes: "হালনাগাদের নোট",
    usage: "ব্যবহারের শর্ত:",
    visit: "উৎসের ওয়েবসাইটে যান",
  },
} as const;

const SOURCE_ICONS: Record<string, LucideIcon> = {
  "world-bank": Landmark,
  "exchange-rates": RefreshCw,
  opendatabd: Database,
  "bangladesh-bank": Building2,
  bbs: Building2,
  "data-gov-bd": LayoutGrid,
};

export function SourceCard({
  source,
  compact = false,
  language,
}: {
  source: SourceRegistryEntry;
  compact?: boolean;
  language: Language;
}) {
  const copy = COPY[language];
  const Icon = SOURCE_ICONS[source.id] ?? Database;
  const isIntegrated = source.integration === "integrated";

  return (
    <Panel id={source.id} className="flex h-full min-w-0 scroll-mt-24 flex-col">
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>{source.name}</span>
          </span>
        }
        description={source.role}
        action={
          <Badge tone={isIntegrated ? "brand" : "outline"}>
            {isIntegrated ? copy.connected : copy.officialLink}
          </Badge>
        }
      />

      <div className={cn("flex flex-1 flex-col gap-4 p-5 sm:p-6", compact && "gap-3")}>
        <div className="flex flex-wrap items-center gap-2">
          <CadenceBadge cadence={source.cadence} label={source.cadenceLabel} />
          <span className="text-[11px] text-subtle">{source.integrationLabel}</span>
        </div>

        <p className="text-[13px] leading-6 text-muted">{source.accessNote}</p>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
            {copy.where}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {source.endpoints.map((endpoint) => (
              <li
                key={endpoint.url}
                className="rounded-lg border border-line bg-background px-3 py-2"
              >
                <SourceLink href={endpoint.url} className="text-[12px] font-medium">
                  {endpoint.label}
                </SourceLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
            {copy.updateNotes}
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-muted">{source.freshnessNote}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px]">
          <span className="text-subtle">
            {copy.usage}{" "}
            {source.licenseUrl ? (
              <SourceLink href={source.licenseUrl} className="text-muted">
                {source.license}
              </SourceLink>
            ) : (
              <span className="text-muted">{source.license}</span>
            )}
          </span>
          <SourceLink href={source.homepageUrl} className="text-muted">
            {copy.visit}
          </SourceLink>
        </div>
      </div>
    </Panel>
  );
}
