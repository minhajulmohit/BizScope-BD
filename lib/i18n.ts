export const LANGUAGES = ["en", "bn"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_COOKIE = "bizscope-language";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "bn";
}

const UI_COPY_EN = {
  languageName: "English",
  languageShortLabel: "বাং",
  languageSwitchLabel: "বাংলা",
  languageSwitchAria: "বাংলা — switch site language to Bangla",
  themeToggle: "Toggle light and dark theme",
  opensInNewTab: "(opens in a new tab)",
  retry: "Retry",
  refreshing: "Refreshing…",
  source: "Source",
  chartLegend: "Chart legend",
  chartObservation: "Observation",
  noObservation: "No observation",
  annual: "Annual",
  yearly: "Yearly",
  latest: "Latest",
  vs: "vs",
  cadence: {
    daily: "Daily reference",
    periodic: "Periodic statistics",
    catalog: "Catalog",
    manual: "Manual access",
  },
} as const;

export type UiCopy = {
  languageName: string;
  languageShortLabel: string;
  languageSwitchLabel: string;
  languageSwitchAria: string;
  themeToggle: string;
  opensInNewTab: string;
  retry: string;
  refreshing: string;
  source: string;
  chartLegend: string;
  chartObservation: string;
  noObservation: string;
  annual: string;
  yearly: string;
  latest: string;
  vs: string;
  cadence: Record<keyof typeof UI_COPY_EN.cadence, string>;
};

const UI_COPY_BN: UiCopy = {
  languageName: "বাংলা",
  languageShortLabel: "EN",
  languageSwitchLabel: "English",
  languageSwitchAria: "English — সাইটের ভাষা ইংরেজিতে বদলান",
  themeToggle: "লাইট ও ডার্ক থিম বদলান",
  opensInNewTab: "(নতুন ট্যাবে খুলবে)",
  retry: "আবার চেষ্টা করুন",
  refreshing: "রিফ্রেশ হচ্ছে…",
  source: "উৎস",
  chartLegend: "চার্টের লেজেন্ড",
  chartObservation: "পর্যবেক্ষণ",
  noObservation: "কোনো পর্যবেক্ষণ নেই",
  annual: "বার্ষিক",
  yearly: "প্রতি বছর",
  latest: "সর্বশেষ",
  vs: "বনাম",
  cadence: {
    daily: "দৈনিক রেফারেন্স",
    periodic: "সাময়িক পরিসংখ্যান",
    catalog: "ক্যাটালগ",
    manual: "ম্যানুয়াল অ্যাক্সেস",
  },
};

export const UI_COPY: Record<Language, UiCopy> = {
  en: UI_COPY_EN,
  bn: UI_COPY_BN,
};
