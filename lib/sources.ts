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
    integrationLabel: "Integrated · automatic",
    accessNote:
      "Public Indicators API. No API key or account is required. Data are returned as JSON observations for Bangladesh (country code BGD).",
    freshnessNote:
      "Annual observations published at the World Bank's discretion. The latest observation can lag the current calendar year and earlier years may be revised. The API's lastupdated field is shown alongside values.",
    homepageUrl: "https://data.worldbank.org/country/bangladesh",
    documentationUrl:
      "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api",
    license: "CC BY 4.0",
    licenseUrl: "https://datacatalog.worldbank.org/public-licenses",
    endpoints: [
      {
        label: "Indicator observations",
        url: "https://api.worldbank.org/v2/country/BGD/indicator/{INDICATOR_CODE}?format=json&mrnev=10",
        format: "JSON REST",
      },
      {
        label: "Indicator query documentation",
        url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries",
        format: "HTML documentation",
      },
    ],
  },
  {
    id: "exchange-rates",
    name: "ExchangeRate-API — Open ER-API",
    shortName: "Open ER-API",
    role: "Third-party daily currency reference rates",
    cadence: "daily",
    cadenceLabel: "Daily reference · third-party",
    integration: "integrated",
    integrationLabel: "Integrated · automatic",
    accessNote:
      "Public open-access endpoint with no API key for the USD base feed. Rate limits and fair-use terms still apply to the provider service.",
    freshnessNote:
      "The provider typically updates the feed once per day and supplies last-updated and next-update timestamps. This is a reference rate, not a live market quote and not the official Bangladesh Bank buying or selling rate.",
    homepageUrl: "https://www.exchangerate-api.com/",
    documentationUrl: "https://www.exchangerate-api.com/docs/free",
    license: "Provider terms; attribution required",
    licenseUrl: "https://www.exchangerate-api.com/terms",
    endpoints: [
      {
        label: "USD base rates",
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
    integrationLabel: "Integrated · catalog only",
    accessNote:
      "The public GET catalog endpoints are documented as requiring no authentication. Dataset file downloads may require authentication and are not proxied or downloaded by this application.",
    freshnessNote:
      "Catalog contents change as contributors publish datasets. Dataset licenses, formats, and access conditions vary by record and should be checked before reuse.",
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
        label: "Platform statistics",
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
    integrationLabel: "Linked · not automated",
    accessNote:
      "The National Summary Data Page and open-data pages are official HTML publications. During implementation the exchange-rate pages returned an interactive bot-verification screen, and no documented public JSON endpoint was found for automatic ingestion. No scraping is attempted.",
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
    integrationLabel: "Linked · not automated",
    accessNote:
      "BBS publishes reports and tables as web pages, PDF files, and spreadsheets. No public JSON API was verified for the indicators listed here, so the application links to the official publications instead of presenting them as live integrations.",
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
    integrationLabel: "Directory · not automated",
    accessNote:
      "Used as a discovery directory for public government datasets. No machine-readable catalog endpoint was verified for this release, so links are provided to the portal rather than an API integration.",
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
