import type { SourceRegistryEntry } from "@/lib/api/types";

/**
 * The public source register used by the Sources & Methodology page.
 * Only sources with a working machine-readable integration are labelled
 * "integrated". Everything else is explicitly described as a manual link.
 */
export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  {
    id: "world-bank",
    name: "World Bank — World Development Indicators",
    shortName: "World Bank",
    role: "Macroeconomic, population, and trade indicators",
    cadence: "periodic",
    cadenceLabel: "Annual · periodically revised",
    integration: "integrated",
    integrationLabel: "Connected automatically",
    accessNote:
      "We read the World Bank's public data service for Bangladesh. No account, key, or special access is needed.",
    freshnessNote:
      "The World Bank publishes these figures once a year and can revise earlier years. The latest year can lag the calendar, so every value shows its actual observation year. The date the dataset was last revised is shown too.",
    homepageUrl: "https://data.worldbank.org/country/bangladesh",
    documentationUrl:
      "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api",
    license: "CC BY 4.0",
    licenseUrl: "https://datacatalog.worldbank.org/public-licenses",
    endpoints: [
      {
        label: "World Bank data for Bangladesh",
        url: "https://api.worldbank.org/v2/country/BGD/indicator/{INDICATOR_CODE}?format=json&mrnev=10",
        format: "JSON REST",
      },
      {
        label: "World Bank data help",
        url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries",
        format: "HTML documentation",
      },
    ],
  },
  {
    id: "exchange-rates",
    name: "ExchangeRate-API",
    shortName: "ExchangeRate-API",
    role: "Daily currency reference rates",
    cadence: "daily",
    cadenceLabel: "Daily reference · third-party",
    integration: "integrated",
    integrationLabel: "Connected automatically",
    accessNote:
      "A free public currency service. It needs no account or key, but its fair-use terms still apply.",
    freshnessNote:
      "The service usually updates once a day and provides update times. These are reference values, not a live market quote or Bangladesh Bank's official buying or selling rate.",
    homepageUrl: "https://www.exchangerate-api.com/",
    documentationUrl: "https://www.exchangerate-api.com/docs/free",
    license: "Provider terms; attribution required",
    licenseUrl: "https://www.exchangerate-api.com/terms",
    endpoints: [
      {
        label: "Daily reference rates",
        url: "https://open.er-api.com/v6/latest/USD",
        format: "JSON REST",
      },
    ],
  },
  {
    id: "opendatabd",
    name: "OpenDataBD",
    shortName: "OpenDataBD",
    role: "Public dataset catalog and metadata",
    cadence: "catalog",
    cadenceLabel: "Catalog · on-demand",
    integration: "integrated",
    integrationLabel: "Connected · catalog only",
    accessNote:
      "The public catalog can be browsed without signing in. Dataset files may require an account and are never downloaded or passed through this site.",
    freshnessNote:
      "The catalog changes as publishers add datasets. Formats, licences, and access conditions vary by record and should be checked before reuse.",
    homepageUrl: "https://opendatabd.com/",
    documentationUrl: "https://www.opendatabd.com/api-docs",
    license: "Varies by dataset",
    licenseUrl: null,
    endpoints: [
      {
        label: "Dataset catalog",
        url: "https://opendatabd.com/api/datasets",
        format: "JSON REST",
      },
      {
        label: "Catalog summary",
        url: "https://opendatabd.com/api/stats",
        format: "JSON REST",
      },
    ],
  },
  {
    id: "bangladesh-bank",
    name: "Bangladesh Bank",
    shortName: "Bangladesh Bank",
    role: "Official monetary, financial, and macro data",
    cadence: "manual",
    cadenceLabel: "Official publication · manual access",
    integration: "official-link",
    integrationLabel: "Official link",
    accessNote:
      "Official web pages and publications. Some exchange-rate pages use a browser check, and no automatic public data feed was available for this release, so these are links only. Nothing is scraped.",
    freshnessNote:
      "Publication schedules vary by table and format. Official exchange rates, reserves, remittances, and interest rates should be read directly from Bangladesh Bank.",
    homepageUrl: "https://www.bb.org.bd/",
    documentationUrl: null,
    license: "Official Bangladesh Bank publication",
    licenseUrl: null,
    endpoints: [
      {
        label: "National Summary Data Page",
        url: "https://www.bb.org.bd/econdata/nsdp/nsdp_bb.php",
        format: "HTML / SDMX publication",
      },
      {
        label: "Bangladesh Bank Open Data",
        url: "https://www.bb.org.bd/en/index.php/econdata/index",
        format: "HTML with downloadable tables",
      },
      {
        label: "Official exchange rate page",
        url: "https://www.bb.org.bd/en/index.php/econdata/exchangerate",
        format: "HTML / interactive verification",
      },
    ],
  },
  {
    id: "bbs",
    name: "Bangladesh Bureau of Statistics",
    shortName: "BBS",
    role: "National statistics, CPI, GDP, labor, and trade",
    cadence: "manual",
    cadenceLabel: "Official publication · manual access",
    integration: "official-link",
    integrationLabel: "Official link",
    accessNote:
      "BBS publishes reports and tables as web pages, PDF files, and spreadsheets. No automatic public data feed was available for these indicators, so the dashboard links to the official publications.",
    freshnessNote:
      "Release dates follow BBS publication schedules. CPI, quarterly GDP, wage, and trade publications may be revised; check the publication itself for the applicable reference period.",
    homepageUrl: "https://bbs.gov.bd/",
    documentationUrl: null,
    license: "Government of Bangladesh publication terms",
    licenseUrl: null,
    endpoints: [
      {
        label: "Price and wage statistics",
        url: "https://bbs.gov.bd/site/page/29b379ff-7bac-41d9-b321-e41929bab4a1",
        format: "HTML / PDF / Excel",
      },
      {
        label: "GDP publications",
        url: "https://bbs.gov.bd/pages/static-pages/6922df6e933eb65569e21f3f",
        format: "HTML / PDF",
      },
      {
        label: "Foreign trade statistics",
        url: "https://bbs.gov.bd/site/page/58b1c0c8-34b9-45b5-954d-53a2737e7bb1",
        format: "HTML / PDF / Excel",
      },
    ],
  },
  {
    id: "data-gov-bd",
    name: "Bangladesh Government Open Data Portal",
    shortName: "data.gov.bd",
    role: "Government dataset directory",
    cadence: "manual",
    cadenceLabel: "Directory · source discovery",
    integration: "directory",
    integrationLabel: "Directory link",
    accessNote:
      "Used as a directory to find public government datasets. No automatic public catalog feed was available for this release, so the dashboard links to the portal.",
    freshnessNote:
      "Dataset availability, formats, update frequency, and licenses vary by department and record.",
    homepageUrl: "https://data.gov.bd/",
    documentationUrl: null,
    license: "Varies by dataset",
    licenseUrl: null,
    endpoints: [
      {
        label: "Government open data portal",
        url: "https://data.gov.bd/",
        format: "HTML directory",
      },
    ],
  },
];

export const SOURCE_BY_ID = new Map(
  SOURCE_REGISTRY.map((source) => [source.id, source]),
);
