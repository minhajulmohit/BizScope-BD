import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { DataExplorer } from "@/components/data/data-explorer";
import { getLanguage } from "@/lib/i18n-server";
import type { Language } from "@/lib/i18n";

const META = {
  en: {
    title: "Data Explorer",
    description:
      "Search the OpenDataBD public dataset catalog by title and category. Browse dataset formats, publishers, licences, and source links with pagination and honest access notes.",
    ogTitle: "Bangladesh public data explorer",
  },
  bn: {
    title: "ডেটা এক্সপ্লোরার",
    description:
      "শিরোনাম ও বিভাগ অনুযায়ী OpenDataBD-র সর্বজনীন ডেটাসেট ক্যাটালগ খুঁজুন। পেজিনেশন ও সৎ অ্যাক্সেস-নোটসহ ফরম্যাট, প্রকাশক, লাইসেন্স ও উৎস লিংক দেখুন।",
    ogTitle: "বাংলাদেশের সর্বজনীন ডেটা এক্সপ্লোরার",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguage();
  const meta = META[language];

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.ogTitle,
      description: meta.description,
    },
  };
}

const COPY: Record<Language, {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  freeCatalog: string;
  noticeTitle: string;
  noticeBody: string;
}> = {
  en: {
    eyebrow: "Explore / Catalog",
    title: "Data explorer",
    description:
      "Search Bangladesh's public dataset catalog. Browse titles, categories, formats, publishers, and licences — then follow the link to the original source.",
    badge: "OpenDataBD catalog",
    freeCatalog: "Free public catalog",
    noticeTitle: "Catalog metadata, not a data download service.",
    noticeBody:
      "BizScope BD searches OpenDataBD's public catalog. Dataset files may require sign-in and are never proxied or downloaded by this app. Always check the licence and access conditions on the original record before reusing a dataset.",
  },
  bn: {
    eyebrow: "অন্বেষণ / ক্যাটালগ",
    title: "ডেটা এক্সপ্লোরার",
    description:
      "বাংলাদেশের সর্বজনীন ডেটাসেট ক্যাটালগ খুঁজুন। শিরোনাম, বিভাগ, ফরম্যাট, প্রকাশক ও লাইসেন্স দেখুন—তারপর মূল উৎসের লিংকে যান।",
    badge: "OpenDataBD ক্যাটালগ",
    freeCatalog: "বিনামূল্যের সর্বজনীন ক্যাটালগ",
    noticeTitle: "ক্যাটালগের মেটাডেটা, কোনো ডেটা ডাউনলোড সেবা নয়।",
    noticeBody:
      "BizScope BD OpenDataBD-র সর্বজনীন ক্যাটালগে খোঁজে। ডেটাসেট ফাইল খুলতে সাইন-ইন লাগতে পারে এবং এই অ্যাপ কখনো ফাইল প্রক্সি বা ডাউনলোড করে না। ডেটাসেট আবার ব্যবহারের আগে মূল রেকর্ডে লাইসেন্স ও অ্যাক্সেসের শর্ত দেখুন।",
  },
};

export default async function DataPage() {
  const language = await getLanguage();
  const copy = COPY[language];

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="catalog" label={copy.badge} />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            {copy.freeCatalog}
          </span>
        </div>
      </PageHeader>

      <DataNotice title={copy.noticeTitle}>{copy.noticeBody}</DataNotice>

      <DataExplorer />
    </div>
  );
}
