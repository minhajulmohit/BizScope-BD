import type { Metadata } from "next";
import Link from "next/link";
import { getAnalyticsData } from "@/lib/api/world-bank";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { convertAnalyticsToBdt } from "@/lib/utils/display-currency";
import { INDICATOR_ORDER, localizeIndicator } from "@/lib/indicator-catalog";
import { getLanguage } from "@/lib/i18n-server";
import type { AnalyticsData } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";
import { BdtConversionNotice } from "@/components/ui/bdt-conversion-notice";
import { DataNotice } from "@/components/ui/data-notice";
import { ErrorState } from "@/components/ui/states";
import { RetryButton } from "@/components/ui/retry-button";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { EconomyExplorer } from "@/components/economy/economy-explorer";

export const revalidate = 1800;

const META = {
  en: {
    title: "Economic Analytics",
    description:
      "Explore Bangladesh GDP, annual growth, consumer price inflation, unemployment, and population with selected-year charts, data tables, definitions, and observation dates.",
    ogTitle: "Bangladesh economic analytics",
  },
  bn: {
    title: "অর্থনৈতিক বিশ্লেষণ",
    description:
      "নির্বাচিত বছরের চার্ট, ডেটা টেবিল, সংজ্ঞা ও পর্যবেক্ষণের তারিখসহ বাংলাদেশের জিডিপি, বার্ষিক প্রবৃদ্ধি, ভোক্তা মূল্যস্ফীতি, বেকারত্ব ও জনসংখ্যা দেখুন।",
    ogTitle: "বাংলাদেশের অর্থনৈতিক বিশ্লেষণ",
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

const COPY = {
  en: {
    eyebrow: "Economy / Analytics",
    title: "Economic analytics",
    description:
      "A ten-observation view of Bangladesh's national accounts, prices, labor market, and population. Select a metric, narrow the annual range, and inspect the values behind the chart.",
    badge: "Annual World Bank data",
    latest: (year: string) => `Latest observation · ${year}`,
    noticeTitle: "Annual official statistics, subject to revision.",
    noticeBody:
      "The World Bank publishes new observations once a year and can revise past years. Charts and tables use reported years only; missing observations are not extrapolated or filled.",
    methodology: "Read the methodology",
    errorTitle: "Economic data is currently unavailable",
    partialTitle: "Some economic indicators are unavailable",
    errorBody:
      "We couldn't load the World Bank data. No placeholder values are shown. Check your connection or try again.",
    partialBody: (available: number, total: number) =>
      `${available} of ${total} indicators loaded. Only those series are shown.`,
    tryAgain: "Try again",
  },
  bn: {
    eyebrow: "অর্থনীতি / বিশ্লেষণ",
    title: "অর্থনৈতিক বিশ্লেষণ",
    description:
      "বাংলাদেশের জাতীয় হিসাব, মূল্য, শ্রমবাজার ও জনসংখ্যার দশটি পর্যবেক্ষণের দৃশ্য। একটি সূচক বাছুন, বার্ষিক পরিসর কমিয়ে আনুন এবং চার্টের পেছনের মান দেখুন।",
    badge: "বার্ষিক বিশ্বব্যাংক ডেটা",
    latest: (year: string) => `সর্বশেষ পর্যবেক্ষণ · ${year}`,
    noticeTitle: "বার্ষিক সরকারি পরিসংখ্যান, সংশোধনের অধীন।",
    noticeBody:
      "বিশ্বব্যাংক বছরে একবার নতুন পর্যবেক্ষণ প্রকাশ করে এবং আগের বছর সংশোধন করতে পারে। চার্ট ও টেবিল কেবল রিপোর্ট করা বছর ব্যবহার করে; অনুপস্থিত পর্যবেক্ষণ অনুমান বা পূরণ করা হয় না।",
    methodology: "পদ্ধতি পড়ুন",
    errorTitle: "অর্থনৈতিক ডেটা এখন পাওয়া যাচ্ছে না",
    partialTitle: "কিছু অর্থনৈতিক সূচক পাওয়া যাচ্ছে না",
    errorBody:
      "বিশ্বব্যাংকের ডেটা লোড করা যায়নি। কোনো প্লেসহোল্ডার মান দেখানো হচ্ছে না। সংযোগ পরীক্ষা করুন বা আবার চেষ্টা করুন।",
    partialBody: (available: number, total: number) =>
      `${total}টির মধ্যে ${available}টি সূচক লোড হয়েছে। কেবল সেই সিরিজগুলো দেখানো হচ্ছে।`,
    tryAgain: "আবার চেষ্টা করুন",
  },
};

export default async function EconomyPage() {
  const language = await getLanguage();
  const copy = COPY[language];
  const [analytics, currency] = await Promise.all([
    getAnalyticsData(),
    getCurrencyData(),
  ]);
  const converted = convertAnalyticsToBdt(analytics, currency.bdtRate);
  const indicators = Object.fromEntries(
    INDICATOR_ORDER.map((key) => {
      const indicator = converted.indicators[key];
      return [key, indicator ? localizeIndicator(indicator, language) : null];
    }),
  ) as AnalyticsData["indicators"];
  const displayAnalytics: AnalyticsData = { ...converted, indicators };

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="periodic" label={copy.badge} />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted">
            {copy.latest(String(analytics.summary.latestObservationYear ?? "\u2014"))}
          </span>
        </div>
      </PageHeader>

      <DataNotice title={copy.noticeTitle}>
        {copy.noticeBody}{" "}
        <Link
          href="/sources"
          className="font-medium text-foreground-soft underline underline-offset-2 hover:text-foreground"
        >
          {copy.methodology}
        </Link>
        {language === "bn" ? "।" : "."}
      </DataNotice>

      <BdtConversionNotice
        bdtPerUsd={currency.bdtRate}
        updatedAt={currency.lastUpdatedUtc}
        language={language}
      />

      {analytics.status !== "ok" ? (
        <ErrorState
          title={
            analytics.status === "error" ? copy.errorTitle : copy.partialTitle
          }
          description={
            analytics.status === "error"
              ? copy.errorBody
              : copy.partialBody(
                  analytics.summary.availableIndicators,
                  analytics.summary.totalIndicators,
                )
          }
          action={<RetryButton label={copy.tryAgain} />}
        />
      ) : null}

      <EconomyExplorer analytics={displayAnalytics} />
    </div>
  );
}
