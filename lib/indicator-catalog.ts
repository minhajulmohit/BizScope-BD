import type {
  DataCadence,
  EconomicIndicator,
  IndicatorKey,
  MetricUnit,
} from "@/lib/api/types";
import type { Language } from "@/lib/i18n";

export interface IndicatorTranslation {
  name: string;
  shortName: string;
  definition: string;
  unitLabel: string;
  cadenceLabel: string;
}

export interface IndicatorDefinition {
  key: IndicatorKey;
  code: string;
  name: string;
  shortName: string;
  definition: string;
  unit: MetricUnit;
  unitLabel: string;
  valueDecimals: number;
  chartColor: string;
  cadence: DataCadence;
  cadenceLabel: string;
  bn: IndicatorTranslation;
}

export const WORLD_BANK_CADENCE: DataCadence = "periodic";

export const WORLD_BANK_CADENCE_LABEL = "Annual · periodically revised";

export const WORLD_BANK_CADENCE_LABEL_BN = "বার্ষিক · সময়ে সময়ে সংশোধিত";

export const INDICATOR_ORDER: IndicatorKey[] = [
  "gdp",
  "gdpGrowth",
  "inflation",
  "unemployment",
  "population",
  "exports",
  "imports",
];

export const INDICATOR_DEFINITIONS: Record<IndicatorKey, IndicatorDefinition> =
  {
    gdp: {
      key: "gdp",
      code: "NY.GDP.MKTP.CD",
      name: "GDP (current US$)",
      shortName: "Gross domestic product",
      definition:
        "Gross domestic product at purchaser's prices, converted to current US dollars using World Bank official exchange rates. GDP is the sum of gross value added by all resident producers plus product taxes and minus subsidies.",
      unit: "usd",
      unitLabel: "Current US dollars",
      valueDecimals: 1,
      chartColor: "var(--chart-emerald)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "জিডিপি (চলতি মার্কিন ডলার)",
        shortName: "মোট দেশজ উৎপাদন (জিডিপি)",
        definition:
          "ক্রেতার মূল্যে মোট দেশজ উৎপাদন, যা বিশ্বব্যাংকের সরকারি বিনিময় হার ব্যবহার করে চলতি মার্কিন ডলারে রূপান্তর করা হয়েছে। জিডিপি হলো সব আবাসিক উৎপাদকের মোট মূল্য সংযোজন, সঙ্গে পণ্য কর যোগ ও ভর্তুকি বাদ দিয়ে।",
        unitLabel: "চলতি মার্কিন ডলার",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
    gdpGrowth: {
      key: "gdpGrowth",
      code: "NY.GDP.MKTP.KD.ZG",
      name: "GDP growth (annual %)",
      shortName: "Annual GDP growth",
      definition:
        "Annual percentage growth rate of GDP at market prices based on constant local currency. Aggregates are based on constant prices.",
      unit: "percent",
      unitLabel: "Annual percent",
      valueDecimals: 2,
      chartColor: "var(--chart-emerald)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "জিডিপি প্রবৃদ্ধি (বার্ষিক %)",
        shortName: "বার্ষিক জিডিপি প্রবৃদ্ধি",
        definition:
          "স্থির স্থানীয় মুদ্রায় বাজারমূল্যের জিডিপির বার্ষিক শতকরা প্রবৃদ্ধির হার। সমষ্টিগত হিসাবও স্থির মূল্যে করা হয়।",
        unitLabel: "বার্ষিক শতাংশ",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
    inflation: {
      key: "inflation",
      code: "FP.CPI.TOTL.ZG",
      name: "Inflation, consumer prices (annual %)",
      shortName: "Consumer price inflation",
      definition:
        "Annual percentage change in the cost to the average consumer of acquiring a fixed basket of goods and services. The Laspeyres formula is generally used.",
      unit: "percent",
      unitLabel: "Annual percent",
      valueDecimals: 2,
      chartColor: "var(--chart-amber)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "মুদ্রাস্ফীতি, ভোক্তা মূল্য (বার্ষিক %)",
        shortName: "ভোক্তা মূল্য মুদ্রাস্ফীতি",
        definition:
          "পণ্য ও সেবার একটি নির্দিষ্ট ঝুড়ি কিনতে গড় ভোক্তার খরচের বার্ষিক শতকরা পরিবর্তন। সাধারণত ল্যাসপিয়ারেস সূত্র ব্যবহার করা হয়।",
        unitLabel: "বার্ষিক শতাংশ",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
    unemployment: {
      key: "unemployment",
      code: "SL.UEM.TOTL.ZS",
      name: "Unemployment, total (% of total labor force)",
      shortName: "Unemployment rate",
      definition:
        "Share of the labor force that is without work but available for and seeking employment. This is a modeled International Labour Organization (ILO) estimate.",
      unit: "percent",
      unitLabel: "Percent of labor force",
      valueDecimals: 2,
      chartColor: "var(--chart-blue)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "বেকারত্ব, মোট (মোট শ্রমশক্তির %)",
        shortName: "বেকারত্বের হার",
        definition:
          "শ্রমশক্তির যে অংশের কাজ নেই, তবে কাজের জন্য প্রস্তুত এবং খুঁজছে। এটি আন্তর্জাতিক শ্রম সংস্থা (ILO)-র একটি মডেলভিত্তিক অনুমান।",
        unitLabel: "শ্রমশক্তির শতাংশ",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
    population: {
      key: "population",
      code: "SP.POP.TOTL",
      name: "Population, total",
      shortName: "Total population",
      definition:
        "Total population based on the de facto definition, which counts all residents regardless of legal status or citizenship. Midyear estimates are used.",
      unit: "people",
      unitLabel: "People",
      valueDecimals: 0,
      chartColor: "var(--chart-slate)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "মোট জনসংখ্যা",
        shortName: "মোট জনসংখ্যা",
        definition:
          "প্রকৃত বাসিন্দার সংজ্ঞার ভিত্তিতে মোট জনসংখ্যা, যেখানে আইনি অবস্থা বা নাগরিকত্ব নির্বিশেষে সব বাসিন্দাকে গণনা করা হয়। বছরের মধ্যভাগের অনুমান ব্যবহার করা হয়।",
        unitLabel: "জনসংখ্যা",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
    exports: {
      key: "exports",
      code: "NE.EXP.GNFS.CD",
      name: "Exports of goods and services (current US$)",
      shortName: "Exports of goods & services",
      definition:
        "Value of all goods and other market services provided to the rest of the world. It includes merchandise, freight, insurance, transport, travel, royalties, license fees, and other services, but excludes labor and property income.",
      unit: "usd",
      unitLabel: "Current US dollars",
      valueDecimals: 1,
      chartColor: "var(--chart-emerald)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "পণ্য ও সেবা রপ্তানি (চলতি মার্কিন ডলার)",
        shortName: "পণ্য ও সেবা রপ্তানি",
        definition:
          "বিশ্বের বাকি অংশকে সরবরাহ করা সব পণ্য ও বাজারসেবার মূল্য। এতে পণ্য, মালবাহী, বীমা, পরিবহন, ভ্রমণ, রয়্যালটি, লাইসেন্স ফি ও অন্যান্য সেবা অন্তর্ভুক্ত; শ্রম ও সম্পত্তি আয় বাদ দেওয়া হয়।",
        unitLabel: "চলতি মার্কিন ডলার",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
    imports: {
      key: "imports",
      code: "NE.IMP.GNFS.CD",
      name: "Imports of goods and services (current US$)",
      shortName: "Imports of goods & services",
      definition:
        "Value of all goods and other market services received from the rest of the world. It includes merchandise, freight, insurance, transport, travel, royalties, license fees, and other services, but excludes labor and property income.",
      unit: "usd",
      unitLabel: "Current US dollars",
      valueDecimals: 1,
      chartColor: "var(--chart-blue)",
      cadence: WORLD_BANK_CADENCE,
      cadenceLabel: WORLD_BANK_CADENCE_LABEL,
      bn: {
        name: "পণ্য ও সেবা আমদানি (চলতি মার্কিন ডলার)",
        shortName: "পণ্য ও সেবা আমদানি",
        definition:
          "বিশ্বের বাকি অংশ থেকে গ্রহণ করা সব পণ্য ও বাজারসেবার মূল্য। এতে পণ্য, মালবাহী, বীমা, পরিবহন, ভ্রমণ, রয়্যালটি, লাইসেন্স ফি ও অন্যান্য সেবা অন্তর্ভুক্ত; শ্রম ও সম্পত্তি আয় বাদ দেওয়া হয়।",
        unitLabel: "চলতি মার্কিন ডলার",
        cadenceLabel: WORLD_BANK_CADENCE_LABEL_BN,
      },
    },
  };

export const OVERVIEW_INDICATOR_KEYS: IndicatorKey[] = [
  "gdp",
  "gdpGrowth",
  "inflation",
  "unemployment",
  "population",
];

export const TRADE_INDICATOR_KEYS: IndicatorKey[] = ["exports", "imports"];

/**
 * Applies the Bengali catalogue copy to an API indicator. The numeric series,
 * source dates, and IDs are never changed by localisation.
 */
export function localizeIndicator(
  indicator: EconomicIndicator,
  language: Language,
): EconomicIndicator {
  if (language === "en") return indicator;

  const definition = INDICATOR_DEFINITIONS[indicator.key];
  const inBdt = indicator.unit === "bdt";

  return {
    ...indicator,
    name: inBdt
      ? definition.bn.name.replace("চলতি মার্কিন ডলার", "টাকার সমতুল্য")
      : definition.bn.name,
    shortName: definition.bn.shortName,
    definition: definition.bn.definition,
    unitLabel: inBdt ? "টাকার সমতুল্য" : definition.bn.unitLabel,
    source: {
      ...indicator.source,
      cadenceLabel: definition.bn.cadenceLabel,
    },
  };
}
