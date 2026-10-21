import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { formatUtcDate, getCurrencyName } from "@/lib/utils/format";
import { getLanguage } from "@/lib/i18n-server";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorState } from "@/components/ui/states";
import { RetryButton } from "@/components/ui/retry-button";
import { CadenceBadge } from "@/components/ui/cadence-badge";
import { SourceLink } from "@/components/ui/source-link";
import { CurrencyWorkspace } from "@/components/currency/currency-workspace";

export const revalidate = 1800;

const META = {
  en: {
    title: "Currency & Exchange Rates",
    description:
      "Convert between currencies and see Bangladeshi taka reference rates from ExchangeRate-API, with clear attribution and separate links to Bangladesh Bank's official rates.",
    ogTitle: "Dollar–taka and currency reference rates",
  },
  bn: {
    title: "মুদ্রা ও বিনিময় হার",
    description:
      "ExchangeRate-API থেকে টাকার রেফারেন্স হারে মুদ্রা রূপান্তর করুন, স্পষ্ট স্বীকৃতি এবং বাংলাদেশ ব্যাংকের সরকারি হারের আলাদা লিংকসহ।",
    ogTitle: "ডলার–টাকা ও মুদ্রার রেফারেন্স হার",
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
    eyebrow: "Currency / Reference rates",
    title: "Currency & exchange rates",
    description:
      "A currency converter and taka-based reference-rate table using a third-party daily update. These are indicative reference rates — not Bangladesh Bank's official buying or selling rates.",
    dailyBadge: "Daily third-party reference",
    updated: (date: string) => `Updated · ${date}`,
    ratesNotesTitle: "About these rates",
    ratesNotesDescription: "Source, limitations, and why there is no history chart",
    noticeTitle: "Third-party reference data, not an official bank rate.",
    noticeBody:
      "ExchangeRate-API is an independent currency service. Its values can differ from Bangladesh Bank's official rates and are not suitable for settlement, accounting, or regulatory decisions. We check that today's rates are complete and numeric before showing them.",
    errorTitle: "Currency reference rates are unavailable",
    errorBody:
      "The currency service did not return a usable dollar–taka rate. No stale or substitute rate is shown. Official Bangladesh Bank links remain available below.",
    tryAgain: "Try again",
    historyTitle: "No historical exchange-rate chart is shown.",
    historyBody:
      "This service provides today's rates only. BizScope BD does not invent a history or relabel the daily snapshot as a time series. For historical official rates, use Bangladesh Bank's published data.",
    officialTitle: "Official Bangladesh Bank rates",
    officialDescription:
      "The authoritative source for official exchange-rate publications.",
    officialLink: "Official link",
    bankName: "Bangladesh Bank",
    bankRole: "Central bank · official publications",
    bankBody:
      "Bangladesh Bank publishes official exchange rates, the National Summary Data Page, reserves, remittance data, and other financial statistics as web pages and downloadable tables. Some pages require a browser check, and the bank does not provide an automatic feed that this dashboard can use in this release.",
    bankBodySecond:
      "BizScope BD therefore links to the official pages rather than presenting them as automatically updated. The third-party rates above should always be checked against this source before any official use.",
    exchangeRates: "Bangladesh Bank exchange rates",
    nsdp: "National Summary Data Page",
    openData: "Bangladesh Bank open data",
    linkNote:
      "Provided as official reference links. No automatic copying of rates from these pages is claimed.",
  },
  bn: {
    eyebrow: "মুদ্রা / রেফারেন্স হার",
    title: "মুদ্রা ও বিনিময় হার",
    description:
      "তৃতীয় পক্ষের দৈনিক হালনাগাদ ব্যবহার করা একটি মুদ্রা কনভার্টার এবং টাকাভিত্তিক রেফারেন্স হারের টেবিল। এগুলো নির্দেশক রেফারেন্স হার—বাংলাদেশ ব্যাংকের সরকারি ক্রয় বা বিক্রয় হার নয়।",
    dailyBadge: "দৈনিক তৃতীয় পক্ষের রেফারেন্স",
    updated: (date: string) => `হালনাগাদ · ${date}`,
    ratesNotesTitle: "এই হারগুলো সম্পর্কে",
    ratesNotesDescription: "উৎস, সীমাবদ্ধতা এবং ইতিহাস চার্ট না থাকার কারণ",
    noticeTitle: "তৃতীয় পক্ষের রেফারেন্স ডেটা, সরকারি ব্যাংক হার নয়।",
    noticeBody:
      "ExchangeRate-API একটি স্বাধীন মুদ্রা সেবা। এর মান বাংলাদেশ ব্যাংকের সরকারি হারের চেয়ে ভিন্ন হতে পারে এবং নিষ্পত্তি, হিসাবরক্ষণ বা নিয়ন্ত্রক সিদ্ধান্তের জন্য উপযুক্ত নয়। দেখানোর আগে আমরা যাচাই করি যে আজকের হারগুলো সম্পূর্ণ ও সংখ্যায় সঠিক।",
    errorTitle: "মুদ্রার রেফারেন্স হার পাওয়া যাচ্ছে না",
    errorBody:
      "মুদ্রা সেবা কোনো ব্যবহারযোগ্য ডলার–টাকা হার ফেরত দেয়নি। পুরোনো বা বিকল্প হার দেখানো হচ্ছে না। বাংলাদেশ ব্যাংকের সরকারি লিংক নিচে পাওয়া যাবে।",
    tryAgain: "আবার চেষ্টা করুন",
    historyTitle: "ঐতিহাসিক বিনিময় হারের চার্ট দেখানো হয় না।",
    historyBody:
      "এই সেবা কেবল আজকের হার দেয়। BizScope BD কোনো ইতিহাস বানায় না বা দৈনিক স্ন্যাপশটকে সময়-সিরিজ হিসেবে নতুন নাম দেয় না। ঐতিহাসিক সরকারি হারের জন্য বাংলাদেশ ব্যাংকের প্রকাশিত ডেটা ব্যবহার করুন।",
    officialTitle: "বাংলাদেশ ব্যাংকের সরকারি হার",
    officialDescription:
      "সরকারি বিনিময় হার প্রকাশনার নির্ভরযোগ্য উৎস।",
    officialLink: "সরকারি লিংক",
    bankName: "বাংলাদেশ ব্যাংক",
    bankRole: "কেন্দ্রীয় ব্যাংক · সরকারি প্রকাশনা",
    bankBody:
      "বাংলাদেশ ব্যাংক সরকারি বিনিময় হার, জাতীয় সারসংক্ষেপ ডেটা পেজ, রিজার্ভ, রেমিট্যান্স ডেটা ও অন্যান্য আর্থিক পরিসংখ্যান ওয়েব পেজ ও ডাউনলোডযোগ্য টেবিল হিসেবে প্রকাশ করে। কিছু পেজে ব্রাউজার যাচাই দরকার, এবং এই সংস্করণে ড্যাশবোর্ড ব্যবহার করার মতো স্বয়ংক্রিয় ফিড ব্যাংক দেয় না।",
    bankBodySecond:
      "তাই BizScope BD সরকারি পেজগুলোর লিংক দেয়, সেগুলোকে স্বয়ংক্রিয়ভাবে হালনাগাদ হিসেবে উপস্থাপন করে না। কোনো সরকারি ব্যবহারের আগে উপরের তৃতীয় পক্ষের হার সবসময় এই উৎসের সঙ্গে মিলিয়ে দেখা উচিত।",
    exchangeRates: "বাংলাদেশ ব্যাংকের বিনিময় হার",
    nsdp: "জাতীয় সারসংক্ষেপ ডেটা পেজ",
    openData: "বাংলাদেশ ব্যাংকের ওপেন ডেটা",
    linkNote:
      "সরকারি রেফারেন্স লিংক হিসেবে দেওয়া। এই পেজগুলো থেকে হার স্বয়ংক্রিয়ভাবে কপি করার কোনো দাবি করা হয় না।",
  },
};

export default async function CurrencyPage() {
  const language = await getLanguage();
  const copy = COPY[language];
  const currency = await getCurrencyData();
  const currencyNames = Object.fromEntries(
    currency.rates.map((quote) => [quote.code, getCurrencyName(quote.code, language)]),
  );

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CadenceBadge cadence="daily" label={copy.dailyBadge} />
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px] text-muted">
            {copy.updated(formatUtcDate(currency.lastUpdatedUtc))}
          </span>
        </div>
      </PageHeader>

      {currency.status === "error" ? (
        <ErrorState
          title={copy.errorTitle}
          description={copy.errorBody}
          action={<RetryButton label={copy.tryAgain} />}
        />
      ) : (
        <CurrencyWorkspace data={currency} currencyNames={currencyNames} />
      )}

      <Disclosure
        summary={copy.ratesNotesTitle}
        description={copy.ratesNotesDescription}
      >
        <div className="space-y-3">
          <DataNotice tone="warning" title={copy.noticeTitle}>
            {copy.noticeBody}
          </DataNotice>
          <DataNotice tone="info" title={copy.historyTitle}>
            {copy.historyBody}
          </DataNotice>
        </div>
      </Disclosure>

      <Disclosure
        summary={copy.officialTitle}
        description={copy.officialDescription}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
          <div className="space-y-3 text-[13px] leading-6 text-muted">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-muted text-muted">
                <Landmark className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  {copy.bankName}
                </p>
                <p className="text-[11px] text-subtle">
                  {copy.bankRole}
                </p>
              </div>
            </div>
            <p>{copy.bankBody}</p>
            <p>{copy.bankBodySecond}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-background p-4">
            <SourceLink
              href="https://www.bb.org.bd/en/index.php/econdata/exchangerate"
              className="text-[13px] font-medium"
            >
              {copy.exchangeRates}
            </SourceLink>
            <SourceLink
              href="https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php"
              className="text-[13px] font-medium"
            >
              {copy.nsdp}
            </SourceLink>
            <SourceLink
              href="https://www.bb.org.bd/en/index.php/econdata/index"
              className="text-[13px] font-medium"
            >
              {copy.openData}
            </SourceLink>
            <p className="mt-1 border-t border-line pt-2 text-[11px] leading-4 text-subtle">
              {copy.linkNote}
            </p>
          </div>
        </div>
      </Disclosure>
    </div>
  );
}
