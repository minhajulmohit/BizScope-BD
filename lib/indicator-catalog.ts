import type { DataCadence, IndicatorKey, MetricUnit } from "@/lib/api/types";

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
}

export const WORLD_BANK_CADENCE: DataCadence = "periodic";

export const WORLD_BANK_CADENCE_LABEL = "Annual · periodically revised";

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
