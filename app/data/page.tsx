import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { DataExplorer } from "@/components/data/data-explorer";

const PAGE_DESCRIPTION =
  "Search the OpenDataBD public dataset catalog by title and category. Browse dataset formats, publishers, licences, and source links with pagination and honest access notes.";

export const metadata: Metadata = {
  title: "Data Explorer",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "Bangladesh public data explorer",
    description: PAGE_DESCRIPTION,
  },
};

export default function DataPage() {
  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow="Explore / Catalog"
        title="Data explorer"
        description="Search Bangladesh's public dataset catalog. Browse titles, categories, formats, publishers, and licences — then follow the link to the original source."
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="catalog" label="OpenDataBD catalog" />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            Free public catalog
          </span>
        </div>
      </PageHeader>

      <DataNotice title="Catalog metadata, not a data download service.">
        BizScope BD searches OpenDataBD&apos;s public catalog. Dataset files may
        require sign-in and are never proxied or downloaded by this app. Always
        check the licence and access conditions on the original record before
        reusing a dataset.
      </DataNotice>

      <DataExplorer />
    </div>
  );
}
