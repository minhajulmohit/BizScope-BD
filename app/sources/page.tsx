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
import { SOURCE_REGISTRY, localizeSource } from "@/lib/sources";
import {
  INDICATOR_DEFINITIONS,
  INDICATOR_ORDER,
} from "@/lib/indicator-catalog";
import { formatUtcDate, formatUtcDateTime } from "@/lib/utils/format";
import { getLanguage } from "@/lib/i18n-server";
import type { Language } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { DataNotice } from "@/components/ui/data-notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/ui/source-link";
import { SourceHealth } from "@/components/source-health";
import { SourceCard } from "@/components/sources/source-card";

export const revalidate = 1800;

const COPY = {
  en: {
    metaTitle: "Sources & Methodology",
    metaDescription:
      "Where every number in BizScope BD comes from, how often it changes, and what the dashboard does and does not claim — including official sources that are linked rather than copied automatically.",
    eyebrow: "Reference / Methodology",
    title: "Sources & methodology",
    description:
      "Where every number comes from, how often it changes, and what this release does not claim. Automatic connections and official links are labelled separately.",
    connectedBadge: "3 connected sources",
    noRealtimeBadge: "No real-time data",
    noticeTitle: "No real-time data is included.",
    noticeBody:
      "BizScope BD contains a daily third-party currency reference, annual periodically revised World Bank statistics, and an on-demand public dataset catalog. Nothing on this dashboard is a live market quote or a real-time official statistic.",
    navAria: "On this page",
    nav: {
      freshness: "Update types",
      health: "Source status",
      providers: "Connected sources",
      official: "Official links",
      indicators: "The seven indicators",
      caching: "Update checks",
      licensing: "Licensing",
      limitations: "Limitations",
    },
    freshnessEyebrow: "Update types",
    freshnessTitle: "Four kinds of data freshness",
    freshnessTiers: [
      {
        label: "Daily reference",
        title: "Currency reference rates",
        description:
          "ExchangeRate-API provides one reference update each day. We keep a short-term copy so pages load quickly; it is not a live ticker or an official bank rate.",
      },
      {
        label: "Annual official",
        title: "World Bank statistics",
        description:
          "Seven yearly series, checked at most every six hours. Every value shows its observation year, and earlier years can be revised.",
      },
      {
        label: "Public catalog",
        title: "OpenDataBD dataset listings",
        description:
          "Catalog details are checked at most every ten minutes. Dataset files and download access are not copied or stored.",
      },
      {
        label: "Official links",
        title: "Bangladesh Bank, BBS, data.gov.bd",
        description:
          "Official websites are linked directly. Nothing is copied, scraped, or presented as an automatic feed.",
      },
    ],
    healthTitle: "Source status",
    healthDescription:
      "Last successful check and current state for each connected source.",
    checkedEvery: "Checked every 5 minutes",
    providersEyebrow: "Connected automatically",
    providersTitle: "Sources the dashboard reads for you",
    providersDescription:
      "We check these sources on the server, with timeouts, and only use responses that pass our checks. No account or key is needed.",
    officialEyebrow: "Official links",
    officialTitle: "Official sources linked, not copied automatically",
    officialDescription:
      "These organizations publish web pages, PDFs, spreadsheets, or data catalogs. They are included for authoritative follow-up. We do not claim an automatic feed from them.",
    indicatorsTitle: "The seven World Bank indicators",
    indicatorsDescription:
      "All are yearly and cover Bangladesh. Where the World Bank publishes in US dollars, the dashboard shows a BDT equivalent at the current reference rate.",
    available: (available: number, total: number) =>
      `${available}/${total} available`,
    indicatorTableAria: "World Bank indicator reference table",
    indicatorCaption:
      "World Bank indicators, units shown, frequency, latest observation year, and source",
    indicator: "Indicator",
    unitShown: "Unit shown",
    frequency: "Frequency",
    latestYear: "Latest year",
    source: "Source",
    bdtEquivalent: "BDT equivalent",
    yearly: "Yearly",
    worldBank: "World Bank",
    lastUpdated: (provider: string, checked: string) =>
      `World Bank last updated: ${provider} · Last checked by BizScope: ${checked}`,
    someUnavailable: "Some series were unavailable at the last check.",
    allLoaded: "All seven series loaded at the last check.",
    cachingTitle: "How often we check for updates",
    cachingDescription:
      "Checking more often does not make a source publish new data. Observation years and update times are always shown.",
    cacheTableAria: "Update check frequency table",
    cacheCaption: "Update frequency and check interval by source",
    cacheSource: "Source",
    cacheChanges: "How often it changes",
    cacheChecks: "How often we check",
    cacheMeaning: "What this means",
    cacheRows: [
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
    ],
    cacheNote:
      "If a source is unavailable, we say so and keep the sources that did work. An old value is never presented as a fresh one.",
    licensingTitle: "Licensing & attribution",
    licensingDescription: "Credit and usage terms for each source.",
    worldBankLicense:
      "World Development Indicators are made available under the Creative Commons Attribution 4.0 licence (CC BY 4.0). Charts and tables link to the World Bank indicator pages.",
    licenceLink: "Licence",
    exchangeLicense:
      "Rates are credited to ExchangeRate-API and link to its source page and terms. This application does not present them as official Bangladesh Bank rates.",
    termsLink: "Terms",
    openDataLicense:
      "Dataset metadata is shown with its own licence when available. Licences and access conditions vary by record and remain the responsibility of the dataset publisher. BizScope BD does not redistribute dataset files.",
    officialLicense:
      "Official publications are linked to their source pages. Reuse of those publications is subject to the publisher's terms.",
    verificationTitle: "Verification & failure behaviour",
    verificationDescription:
      "What happens when a source is slow or unavailable.",
    verificationPoints: [
      "The three connected sources are checked by the dashboard. The source status panel above shows their current state.",
      "We check the shape of each response before using it. Missing values stay missing and are never turned into zero.",
      "Each World Bank series loads separately, so one failure does not erase the others. Currency and catalog failures get their own unavailable message.",
      "The status check reports whether a source is responding; it cannot guarantee that every individual observation exists.",
    ],
    readClearly: "Read clearly:",
    rateNote:
      "Retail rates, official bank rates, and the reference rate used here can differ. Check the official source for any regulated or financial decision.",
    limitationsTitle: "Known limitations",
    limitationsDescription:
      "Stated up front so the dashboard is not mistaken for something it is not.",
    limitations: [
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
    ],
    questions:
      "Questions about a value? Start with the source link on its card or table row.",
    back: "Back to overview",
  },
  bn: {
    metaTitle: "উৎস ও পদ্ধতি",
    metaDescription:
      "BizScope BD-র প্রতিটি সংখ্যা কোথা থেকে আসে, কত ঘন ঘন বদলায় এবং ড্যাশবোর্ড কী দাবি করে—আর কী করে না, যার মধ্যে স্বয়ংক্রিয়ভাবে কপি না করে লিংক করা সরকারি উৎসও আছে।",
    eyebrow: "রেফারেন্স / পদ্ধতি",
    title: "উৎস ও পদ্ধতি",
    description:
      "প্রতিটি সংখ্যা কোথা থেকে আসে, কত ঘন ঘন বদলায় এবং এই সংস্করণ কী দাবি করে না। স্বয়ংক্রিয় সংযোগ ও সরকারি লিংক আলাদাভাবে চিহ্নিত।",
    connectedBadge: "৩টি সংযুক্ত উৎস",
    noRealtimeBadge: "রিয়েল-টাইম ডেটা নেই",
    noticeTitle: "কোনো রিয়েল-টাইম ডেটা নেই।",
    noticeBody:
      "BizScope BD-তে আছে একটি দৈনিক তৃতীয় পক্ষের মুদ্রা রেফারেন্স, বছরে প্রকাশিত ও সময়ে সময়ে সংশোধিত বিশ্বব্যাংকের পরিসংখ্যান এবং চাহিদামতো সর্বজনীন ডেটাসেট ক্যাটালগ। এই ড্যাশবোর্ডের কোনো কিছু লাইভ বাজার দর বা রিয়েল-টাইম সরকারি পরিসংখ্যান নয়।",
    navAria: "এই পেজে",
    nav: {
      freshness: "হালনাগাদের ধরন",
      health: "উৎসের অবস্থা",
      providers: "সংযুক্ত উৎস",
      official: "সরকারি লিংক",
      indicators: "সাতটি সূচক",
      caching: "হালনাগাদ যাচাই",
      licensing: "লাইসেন্স",
      limitations: "সীমাবদ্ধতা",
    },
    freshnessEyebrow: "হালনাগাদের ধরন",
    freshnessTitle: "চার ধরনের ডেটা সতেজতা",
    freshnessTiers: [
      {
        label: "দৈনিক রেফারেন্স",
        title: "মুদ্রা রেফারেন্স হার",
        description:
          "ExchangeRate-API দিনে একটি রেফারেন্স হালনাগাদ দেয়। পেজ দ্রুত লোড হতে আমরা অল্প সময়ের জন্য একটি কপি রাখি; এটি লাইভ টিকার বা বাংলাদেশ ব্যাংকের সরকারি হার নয়।",
      },
      {
        label: "বার্ষিক সরকারি",
        title: "বিশ্বব্যাংকের পরিসংখ্যান",
        description:
          "সাতটি বার্ষিক সিরিজ, সর্বোচ্চ প্রতি ছয় ঘণ্টায় যাচাই করা হয়। প্রতিটি মান তার পর্যবেক্ষণ বছর দেখায় এবং আগের বছর সংশোধিত হতে পারে।",
      },
      {
        label: "সর্বজনীন ক্যাটালগ",
        title: "OpenDataBD ডেটাসেট তালিকা",
        description:
          "ক্যাটালগের বিবরণ সর্বোচ্চ প্রতি দশ মিনিটে যাচাই করা হয়। ডেটাসেট ফাইল ও ডাউনলোড অ্যাক্সেস কপি বা সংরক্ষণ করা হয় না।",
      },
      {
        label: "সরকারি লিংক",
        title: "বাংলাদেশ ব্যাংক, BBS, data.gov.bd",
        description:
          "সরকারি ওয়েবসাইটে সরাসরি লিংক দেওয়া হয়। কোনো কিছু কপি, স্ক্র্যাপ বা স্বয়ংক্রিয় ফিড হিসেবে উপস্থাপন করা হয় না।",
      },
    ],
    healthTitle: "উৎসের অবস্থা",
    healthDescription:
      "প্রতিটি সংযুক্ত উৎসের সর্বশেষ সফল যাচাই ও বর্তমান অবস্থা।",
    checkedEvery: "প্রতি ৫ মিনিটে যাচাই",
    providersEyebrow: "স্বয়ংক্রিয়ভাবে সংযুক্ত",
    providersTitle: "ড্যাশবোর্ড আপনার জন্য যে উৎস পড়ে",
    providersDescription:
      "এই উৎসগুলো সার্ভারে টাইমআউটসহ যাচাই করি এবং কেবল আমাদের যাচাই পাস করা উত্তর ব্যবহার করি। কোনো অ্যাকাউন্ট বা কী লাগে না।",
    officialEyebrow: "সরকারি লিংক",
    officialTitle: "সরকারি উৎস লিংক করা, স্বয়ংক্রিয়ভাবে কপি নয়",
    officialDescription:
      "এই প্রতিষ্ঠানগুলো ওয়েব পেজ, পিডিএফ, স্প্রেডশিট বা ডেটা ক্যাটালগ প্রকাশ করে। নির্ভরযোগ্য অনুসরণের জন্য সেগুলো যুক্ত। আমরা তাদের থেকে স্বয়ংক্রিয় ফিডের দাবি করি না।",
    indicatorsTitle: "বিশ্বব্যাংকের সাতটি সূচক",
    indicatorsDescription:
      "সবগুলো বার্ষিক এবং বাংলাদেশকে কভার করে। বিশ্বব্যাংক যেখানে মার্কিন ডলারে প্রকাশ করে, ড্যাশবোর্ড সেখানে চলতি রেফারেন্স হারে টাকার সমতুল্য দেখায়।",
    available: (available: number, total: number) =>
      `${total}টির মধ্যে ${available}টি পাওয়া যাচ্ছে`,
    indicatorTableAria: "বিশ্বব্যাংক সূচকের রেফারেন্স টেবিল",
    indicatorCaption:
      "বিশ্বব্যাংকের সূচক, প্রদর্শিত একক, পর্যায়, সর্বশেষ পর্যবেক্ষণ বছর ও উৎস",
    indicator: "সূচক",
    unitShown: "প্রদর্শিত একক",
    frequency: "পর্যায়",
    latestYear: "সর্বশেষ বছর",
    source: "উৎস",
    bdtEquivalent: "টাকার সমতুল্য",
    yearly: "বার্ষিক",
    worldBank: "World Bank",
    lastUpdated: (provider: string, checked: string) =>
      `বিশ্বব্যাংকের সর্বশেষ হালনাগাদ: ${provider} · BizScope-এর সর্বশেষ যাচাই: ${checked}`,
    someUnavailable: "সর্বশেষ যাচাইয়ে কিছু সিরিজ পাওয়া যায়নি।",
    allLoaded: "সর্বশেষ যাচাইয়ে সাতটি সিরিজই লোড হয়েছে।",
    cachingTitle: "কত ঘন ঘন হালনাগাদ যাচাই করি",
    cachingDescription:
      "বেশি ঘন ঘন যাচাই করলে উৎস নতুন ডেটা প্রকাশ করে না। পর্যবেক্ষণ বছর ও হালনাগাদের সময় সবসময় দেখানো হয়।",
    cacheTableAria: "হালনাগাদ যাচাইয়ের কম্পাঙ্ক টেবিল",
    cacheCaption: "উৎসভেদে হালনাগাদের ধরন ও যাচাইয়ের বিরতি",
    cacheSource: "উৎস",
    cacheChanges: "কত ঘন ঘন বদলায়",
    cacheChecks: "কত ঘন ঘন যাচাই করি",
    cacheMeaning: "এর অর্থ",
    cacheRows: [
      {
        source: "World Bank WDI",
        frequency: "বছরে একবার, সংশোধনসহ",
        appCache: "সর্বোচ্চ প্রতি ৬ ঘণ্টায়",
        note: "যাচাই মানে নতুন ডেটা নয়। পর্যবেক্ষণ বছর সবসময় দেখানো হয়।",
      },
      {
        source: "ExchangeRate-API",
        frequency: "সাধারণত দিনে একবার",
        appCache: "সর্বোচ্চ প্রতি ঘণ্টায়",
        note: "পরবর্তী হালনাগাদের সময় দেখানো হয়। হারগুলো তৃতীয় পক্ষের, সরকারি নয়।",
      },
      {
        source: "OpenDataBD ক্যাটালগ",
        frequency: "ডেটাসেট প্রকাশের সঙ্গে বদলায়",
        appCache: "তালিকায় সর্বোচ্চ প্রতি ১০ মিনিট; মোট সংখ্যায় ১ ঘণ্টা",
        note: "ডেটাসেট ফাইল কপি, সংরক্ষণ বা ডাউনলোড করা হয় না।",
      },
      {
        source: "বাংলাদেশ ব্যাংক / BBS / data.gov.bd",
        frequency: "প্রকাশনাভেদে ভিন্ন",
        appCache: "স্বয়ংক্রিয়ভাবে যাচাই করা হয় না",
        note: "সরকারি পেজে সরাসরি যাওয়ার জন্য লিংক দেওয়া।",
      },
    ],
    cacheNote:
      "কোনো উৎস অনুপলব্ধ হলে আমরা তা বলি এবং যে উৎসগুলো কাজ করেছে সেগুলো রাখি। পুরোনো মান কখনো নতুন হিসেবে দেখানো হয় না।",
    licensingTitle: "লাইসেন্স ও স্বীকৃতি",
    licensingDescription: "প্রতিটি উৎসের স্বীকৃতি ও ব্যবহারের শর্ত।",
    worldBankLicense:
      "World Development Indicators ক্রিয়েটিভ কমন্স অ্যাট্রিবিউশন ৪.০ লাইসেন্স (CC BY 4.0)-এর অধীনে পাওয়া যায়। চার্ট ও টেবিল বিশ্বব্যাংকের সূচক পেজে লিংক করে।",
    licenceLink: "লাইসেন্স",
    exchangeLicense:
      "হারগুলো ExchangeRate-API-কে স্বীকৃতি দেওয়া এবং তার উৎস পেজ ও শর্তে লিংক করা। এই অ্যাপ্লিকেশন সেগুলো বাংলাদেশ ব্যাংকের সরকারি হার হিসেবে উপস্থাপন করে না।",
    termsLink: "শর্তাবলি",
    openDataLicense:
      "ডেটাসেটের মেটাডেটা পাওয়া গেলে তার নিজস্ব লাইসেন্সসহ দেখানো হয়। লাইসেন্স ও অ্যাক্সেসের শর্ত রেকর্ডভেদে ভিন্ন এবং ডেটাসেট প্রকাশকের দায়িত্বে থাকে। BizScope BD ডেটাসেট ফাইল পুনর্বিতরণ করে না।",
    officialLicense:
      "সরকারি প্রকাশনা তাদের উৎস পেজে লিংক করা। সেই প্রকাশনা পুনর্ব্যবহার প্রকাশকের শর্তের অধীন।",
    verificationTitle: "যাচাই ও ব্যর্থতার আচরণ",
    verificationDescription:
      "কোনো উৎস ধীর বা অনুপলব্ধ হলে কী হয়।",
    verificationPoints: [
      "ড্যাশবোর্ড তিনটি সংযুক্ত উৎস যাচাই করে। উপরের উৎস-অবস্থা প্যানেল তাদের বর্তমান অবস্থা দেখায়।",
      "ব্যবহারের আগে প্রতিটি উত্তরের গঠন যাচাই করি। অনুপস্থিত মান অনুপস্থিতই থাকে এবং কখনো শূন্য করা হয় না।",
      "বিশ্বব্যাংকের প্রতিটি সিরিজ আলাদাভাবে লোড হয়, তাই একটি ব্যর্থতা অন্যগুলো মুছে দেয় না। মুদ্রা ও ক্যাটালগের ব্যর্থতার জন্য আলাদা বার্তা থাকে।",
      "অবস্থা-যাচাই জানায় কোনো উৎস সাড়া দিচ্ছে কি না; এটি প্রতিটি আলাদা পর্যবেক্ষণ বিদ্যমান থাকার নিশ্চয়তা দিতে পারে না।",
    ],
    readClearly: "স্পষ্ট করে পড়ুন:",
    rateNote:
      "খুচরা হার, সরকারি ব্যাংক হার এবং এখানে ব্যবহৃত রেফারেন্স হার আলাদা হতে পারে। কোনো নিয়ন্ত্রিত বা আর্থিক সিদ্ধান্তের আগে সরকারি উৎস দেখুন।",
    limitationsTitle: "জানা সীমাবদ্ধতা",
    limitationsDescription:
      "শুরুতেই বলা, যাতে ড্যাশবোর্ডকে অন্য কিছু ভুল না করা হয়।",
    limitations: [
      "বিশ্বব্যাংকের মান বার্ষিক এবং চলতি ক্যালেন্ডার বছরের চেয়ে পিছিয়ে থাকতে পারে। প্রতিটি মান তার পর্যবেক্ষণ বছরসহ দেখানো হয়, আর পুরোনো বার্ষিক পর্যবেক্ষণকে কখনো চলতি বলে নতুন নাম দেওয়া হয় না।",
      "বিশ্বব্যাংকের সিরিজ প্রথম প্রকাশের পর সংশোধিত হতে পারে। ড্যাশবোর্ড ঐতিহাসিক সংশোধন ট্র্যাক করে না।",
      "বেকারত্ব ILO-র মডেল-ভিত্তিক অনুমান, প্রতি বছরের সরাসরি জরিপের সংখ্যা নয়।",
      "বিশ্বব্যাংক রপ্তানি ও আমদানি মার্কিন ডলারে প্রকাশ করে। ড্যাশবোর্ড চলতি রেফারেন্স হারে সেগুলো টাকায় রূপান্তর করে। এগুলো পণ্য ও সেবা কভার করে, শুধু পণ্যের কাস্টমস সংখ্যা নয়, এবং মূল্যস্ফীতির সমন্বয় নেই।",
      "বাণিজ্য ভারসাম্য ও রপ্তানি কভারেজ অনুপাত হিসাব করা মান, কেবল যখন দুটো মৌলিক মান একই বছর ও সংজ্ঞা ভাগ করে তখন দেখানো হয়।",
      "মুদ্রা সেবা কেবল চলতি হার দেয়। একটিমাত্র দৈনিক স্ন্যাপশট থেকে ঐতিহাসিক বিনিময় হারের চার্ট তৈরি করা হয় না।",
      "বাস্তবায়নের সময় বাংলাদেশ ব্যাংকের বিনিময় হার পেজে ব্রাউজার যাচাই দরকার ছিল, তাই সরকারি হার স্বয়ংক্রিয়ভাবে কপি না করে লিংক করা হয়েছে।",
      "BBS ও data.gov.bd সরকারি প্রকাশনা ও ডিরেক্টরি উৎস হিসেবে লিংক করা। ড্যাশবোর্ড কারও কাছ থেকে স্বয়ংক্রিয় ফিডের দাবি করে না।",
      "OpenDataBD একটি বিস্তৃত সর্বজনীন ক্যাটালগ, শুধু অর্থনীতির ডেটাসেট সেবা নয়। এর ফলাফল বিষয়, ফরম্যাট, লাইসেন্স ও অ্যাক্সেসের শর্তে ভিন্ন।",
      "এই সংস্করণ মৌলিক ডেটাসেটের নিজস্ব ডেটাবেস রাখে না। প্রয়োজন হলে উৎস থেকে ডেটা পড়া হয় এবং পেজ দ্রুত রাখতে অল্প সময়ের জন্য রাখা হয়।",
    ],
    questions:
      "কোনো মান নিয়ে প্রশ্ন? তার কার্ড বা টেবিল সারির উৎস লিংক থেকে শুরু করুন।",
    back: "ওভারভিউতে ফিরুন",
  },
} satisfies Record<Language, Record<string, unknown>>;

const FRESHNESS_ICONS: LucideIcon[] = [
  RefreshCw,
  CalendarRange,
  Database,
  Landmark,
];

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguage();
  const copy = COPY[language];

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
  };
}

export default async function SourcesPage() {
  const language = await getLanguage();
  const copy = COPY[language];
  const analytics = await getAnalyticsData();
  const hasErrors = analytics.status !== "ok";
  const localizedSources = SOURCE_REGISTRY.map((source) =>
    localizeSource(source, language),
  );
  const integratedSources = localizedSources.filter(
    (source) => source.integration === "integrated",
  );
  const manualSources = localizedSources.filter(
    (source) => source.integration !== "integrated",
  );

  return (
    <div className="space-y-7 sm:space-y-8">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Badge tone="brand">{copy.connectedBadge}</Badge>
          <Badge tone="outline">{copy.noRealtimeBadge}</Badge>
        </div>
      </PageHeader>

      <DataNotice title={copy.noticeTitle}>{copy.noticeBody}</DataNotice>

      <nav
        aria-label={copy.navAria}
        className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3 text-[11px]"
      >
        {[
          ["#freshness", copy.nav.freshness],
          ["#health", copy.nav.health],
          ["#providers", copy.nav.providers],
          ["#official-sources", copy.nav.official],
          ["#indicators", copy.nav.indicators],
          ["#caching", copy.nav.caching],
          ["#licensing", copy.nav.licensing],
          ["#limitations", copy.nav.limitations],
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
          <p className="eyebrow">{copy.freshnessEyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            {copy.freshnessTitle}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {copy.freshnessTiers.map((tier, index) => {
            const Icon = FRESHNESS_ICONS[index] ?? Database;
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
                <p className="mt-1.5 text-[10px] leading-4 text-muted">
                  {tier.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="health" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title={copy.healthTitle}
            description={copy.healthDescription}
            action={
              <span className="inline-flex items-center gap-1 text-[10px] text-subtle">
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                {copy.checkedEvery}
              </span>
            }
          />
          <SourceHealth />
        </Panel>
      </section>

      <section id="providers" className="scroll-mt-24 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{copy.providersEyebrow}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              {copy.providersTitle}
            </h2>
          </div>
          <p className="max-w-md text-[10px] leading-4 text-subtle sm:text-right">
            {copy.providersDescription}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {integratedSources.map((source) => (
            <SourceCard key={source.id} source={source} language={language} />
          ))}
        </div>
      </section>

      <section id="official-sources" className="scroll-mt-24 space-y-3">
        <div>
          <p className="eyebrow">{copy.officialEyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            {copy.officialTitle}
          </h2>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted">
            {copy.officialDescription}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {manualSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              compact
              language={language}
            />
          ))}
        </div>
      </section>

      <section id="indicators" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title={copy.indicatorsTitle}
            description={copy.indicatorsDescription}
            action={
              <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[10px] text-muted">
                {copy.available(
                  analytics.summary.availableIndicators,
                  analytics.summary.totalIndicators,
                )}
              </span>
            }
          />
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label={copy.indicatorTableAria}
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] text-left text-[11px]">
              <caption className="sr-only">{copy.indicatorCaption}</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    {copy.indicator}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {copy.unitShown}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {copy.frequency}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {copy.latestYear}
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    {copy.source}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {INDICATOR_ORDER.map((key) => {
                  const rawDefinition = INDICATOR_DEFINITIONS[key];
                  const definition =
                    language === "bn" ? rawDefinition.bn : rawDefinition;
                  const indicator = analytics.indicators[key];
                  return (
                    <tr
                      key={key}
                      className="transition-colors hover:bg-surface-muted/40"
                    >
                      <th
                        scope="row"
                        className="px-5 py-3 font-medium text-foreground sm:px-6"
                      >
                        {definition.shortName}
                      </th>
                      <td className="px-4 py-3 text-muted">
                        {rawDefinition.unit === "usd"
                          ? copy.bdtEquivalent
                          : definition.unitLabel}
                      </td>
                      <td className="px-4 py-3 text-muted">{copy.yearly}</td>
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
                            `https://data.worldbank.org/indicator/${rawDefinition.code}?locations=BD`
                          }
                          className="text-[10px]"
                        >
                          {copy.worldBank}
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
              {copy.lastUpdated(
                formatUtcDate(analytics.summary.lastProviderUpdate),
                formatUtcDateTime(analytics.summary.lastSuccessfulRetrieval),
              )}
            </p>
            {hasErrors ? (
              <p className="text-amber">{copy.someUnavailable}</p>
            ) : (
              <p>{copy.allLoaded}</p>
            )}
          </div>
        </Panel>
      </section>

      <section id="caching" className="scroll-mt-24">
        <Panel>
          <PanelHeader
            title={copy.cachingTitle}
            description={copy.cachingDescription}
          />
          <div
            className="table-scroll overflow-x-auto scrollbar-subtle"
            role="region"
            aria-label={copy.cacheTableAria}
            tabIndex={0}
          >
            <table className="w-full min-w-[720px] text-left text-[11px]">
              <caption className="sr-only">{copy.cacheCaption}</caption>
              <thead>
                <tr className="border-b border-line bg-surface-muted/60 text-[9px] uppercase tracking-[0.08em] text-subtle">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    {copy.cacheSource}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {copy.cacheChanges}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {copy.cacheChecks}
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    {copy.cacheMeaning}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {copy.cacheRows.map((row) => (
                  <tr key={row.source}>
                    <th
                      scope="row"
                      className="px-5 py-3 font-medium text-foreground sm:px-6"
                    >
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
            {copy.cacheNote}
          </div>
        </Panel>
      </section>

      <section id="licensing" className="scroll-mt-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title={copy.licensingTitle}
              description={copy.licensingDescription}
            />
            <div className="space-y-4 p-5 text-[11px] leading-5 text-muted sm:p-6">
              <div>
                <p className="font-semibold text-foreground">World Bank</p>
                <p className="mt-0.5">
                  {copy.worldBankLicense}{" "}
                  <SourceLink
                    href="https://datacatalog.worldbank.org/public-licenses"
                    className="text-[10px]"
                  >
                    {copy.licenceLink}
                  </SourceLink>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">ExchangeRate-API</p>
                <p className="mt-0.5">
                  {copy.exchangeLicense}{" "}
                  <SourceLink
                    href="https://www.exchangerate-api.com/terms"
                    className="text-[10px]"
                  >
                    {copy.termsLink}
                  </SourceLink>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">OpenDataBD</p>
                <p className="mt-0.5">{copy.openDataLicense}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Bangladesh Bank &amp; BBS
                </p>
                <p className="mt-0.5">{copy.officialLicense}</p>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title={copy.verificationTitle}
              description={copy.verificationDescription}
            />
            <div className="space-y-3 p-5 text-[11px] leading-5 text-muted sm:p-6">
              {copy.verificationPoints.map((point, index) => (
                <p key={point} className="flex gap-2">
                  <span
                    className={
                      index === copy.verificationPoints.length - 1
                        ? "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-subtle"
                        : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    }
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </p>
              ))}
              <div className="rounded-lg border border-line bg-surface-muted/60 px-3 py-2.5 text-[10px] leading-4">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Info className="h-3 w-3" aria-hidden="true" />
                  {copy.readClearly}
                </span>{" "}
                {copy.rateNote}
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section id="limitations" className="scroll-mt-24 scroll-mb-10">
        <Panel>
          <PanelHeader
            title={copy.limitationsTitle}
            description={copy.limitationsDescription}
            action={
              <BookOpenText
                className="h-4 w-4 text-subtle"
                aria-hidden="true"
              />
            }
          />
          <ul className="grid gap-x-8 gap-y-3 p-5 text-[11px] leading-5 text-muted sm:p-6 lg:grid-cols-2">
            {copy.limitations.map((limitation) => (
              <li key={limitation} className="flex gap-2">
                <span
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-subtle"
                  aria-hidden="true"
                />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[10px] text-subtle sm:px-6">
            <p>{copy.questions}</p>
            <Link
              href="/"
              className="font-medium text-muted underline underline-offset-2 hover:text-foreground"
            >
              {copy.back}
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
