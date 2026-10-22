import {
  formatNumber,
  formatPercent,
  isBlank,
  numberField,
  optionalNumberField,
  parseCell,
} from "@/lib/econ-math/io";
import {
  cpiInflation,
  expenditureMultiplier,
  fisherEquation,
  gdpExpenditure,
  gdpPerCapita,
  growthRate,
  moneyMultiplier,
  solveDeflator,
  unemploymentRate,
} from "@/lib/econ-math/macro";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorResult,
} from "@/lib/econ-math/types";

const RATE_HELP = t(
  "Enter rates as decimals: 8% is 0.08.",
  "হার দশমিক হিসেবে লিখুন: ৮% হলে 0.08।",
);

export const macroCalculators: CalculatorDef[] = [
  {
    id: "gdp-expenditure",
    category: "macro",
    title: t("GDP by expenditure", "ব্যয় পদ্ধতিতে জিডিপি"),
    description: t(
      "Add consumption, investment, government spending, and net exports to get GDP.",
      "ভোগ, বিনিয়োগ, সরকারি ব্যয় ও নিট রপ্তানি যোগ করে জিডিপি বের করুন।",
    ),
    whenToUse: t(
      "Use with national-accounts components measured over the same period and in the same currency.",
      "একই সময় ও একই মুদ্রায় মাপা জাতীয় হিসাবের উপাদানের সঙ্গে ব্যবহার করুন।",
    ),
    assumptions: t(
      "All components cover the same period and currency. Net exports equal exports minus imports. This is nominal GDP unless the components are real.",
      "সব উপাদান একই সময় ও মুদ্রার। নিট রপ্তানি = রপ্তানি − আমদানি। উপাদানগুলো বাস্তব না হলে এটি নামমাত্র জিডিপি।",
    ),
    formulaSummary: ["GDP = C + I + G + (X \u2212 M)", "NX = X \u2212 M"],
    legend: t(
      "C = household consumption; I = investment; G = government spending; X = exports; M = imports; NX = net exports.",
      "C = পরিবারভোগ; I = বিনিয়োগ; G = সরকারি ব্যয়; X = রপ্তানি; M = আমদানি; NX = নিট রপ্তানি।",
    ),
    fields: [
      { key: "c", label: t("Consumption (C)", "ভোগ (C)"), defaultValue: "700", kind: "number" },
      { key: "i", label: t("Investment (I)", "বিনিয়োগ (I)"), defaultValue: "250", kind: "number" },
      { key: "g", label: t("Government spending (G)", "সরকারি ব্যয় (G)"), defaultValue: "150", kind: "number" },
      { key: "x", label: t("Exports (X)", "রপ্তানি (X)"), defaultValue: "120", kind: "number" },
      { key: "m", label: t("Imports (M)", "আমদানি (M)"), defaultValue: "180", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { c: "700", i: "250", g: "150", x: "120", m: "180" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const c = numberField(input, "c", t("Consumption", "ভোগ"));
      const i = numberField(input, "i", t("Investment", "বিনিয়োগ"));
      const g = numberField(input, "g", t("Government spending", "সরকারি ব্যয়"));
      const x = numberField(input, "x", t("Exports", "রপ্তানি"));
      const m = numberField(input, "m", t("Imports", "আমদানি"));
      const result = gdpExpenditure(c, i, g, x, m);

      return {
        metrics: [
          { label: t("GDP", "জিডিপি"), value: formatNumber(result.gdp, 4), tone: "brand" },
          { label: t("Net exports (NX)", "নিট রপ্তানি (NX)"), value: formatNumber(result.netExports, 4), tone: result.netExports >= 0 ? "brand" : "warning" },
          { label: t("Consumption share", "ভোগের অংশ"), value: formatPercent(result.gdp === 0 ? Number.NaN : c / result.gdp) },
          { label: t("Investment share", "বিনিয়োগের অংশ"), value: formatPercent(result.gdp === 0 ? Number.NaN : i / result.gdp) },
          { label: t("Government share", "সরকারি ব্যয়ের অংশ"), value: formatPercent(result.gdp === 0 ? Number.NaN : g / result.gdp) },
          { label: t("Net export share", "নিট রপ্তানির অংশ"), value: formatPercent(result.gdp === 0 ? Number.NaN : result.netExports / result.gdp) },
        ],
        steps: [
          {
            title: t("Net exports", "নিট রপ্তানি"),
            formula: "NX = X \u2212 M",
            substitution: `NX = ${formatNumber(x, 3)} \u2212 ${formatNumber(m, 3)} = ${formatNumber(result.netExports, 3)}`,
          },
          {
            title: t("GDP", "জিডিপি"),
            formula: "GDP = C + I + G + NX",
            substitution: `GDP = ${formatNumber(c, 3)} + ${formatNumber(i, 3)} + ${formatNumber(g, 3)} + (${formatNumber(result.netExports, 3)}) = ${formatNumber(result.gdp, 3)}`,
          },
        ],
        interpretation: t(
          `Expenditure-side GDP is ${formatNumber(result.gdp, 3)}. Consumption contributes ${formatPercent(result.gdp === 0 ? Number.NaN : c / result.gdp)} and net exports contribute ${formatPercent(result.gdp === 0 ? Number.NaN : result.netExports / result.gdp)}.`,
          `ব্যয় পদ্ধতিতে জিডিপি ${formatNumber(result.gdp, 3)}। ভোগ অবদান রাখে ${formatPercent(result.gdp === 0 ? Number.NaN : c / result.gdp)} এবং নিট রপ্তানি ${formatPercent(result.gdp === 0 ? Number.NaN : result.netExports / result.gdp)}।`,
        ),
        warnings:
          result.gdp <= 0
            ? [
                t(
                  "GDP is zero or negative; check the component values.",
                  "জিডিপি শূন্য বা ঋণাত্মক; উপাদানের মান যাচাই করুন।",
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "gdp-deflator",
    category: "macro",
    title: t("GDP deflator & real GDP", "জিডিপি ডিফ্লেটর ও বাস্তব জিডিপি"),
    description: t(
      "Find the missing piece among nominal GDP, real GDP, and the GDP deflator.",
      "নামমাত্র জিডিপি, বাস্তব জিডিপি ও জিডিপি ডিফ্লেটরের মধ্যে অনুপস্থিত মান বের করুন।",
    ),
    whenToUse: t(
      "Use to convert nominal GDP into constant-price GDP, or to measure the price level implied by the two.",
      "নামমাত্র জিডিপিকে স্থির-দাম জিডিপিতে রূপান্তর করতে, অথবা দুটি থেকে প্রাপ্ত দামস্তর মাপতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Nominal and real GDP cover the same economy and period. The deflator is an index with the base year equal to 100.",
      "নামমাত্র ও বাস্তব জিডিপি একই অর্থনীতি ও সময়ের। ডিফ্লেটর একটি সূচক যেখানে ভিত্তি বছরের মান ১০০।",
    ),
    formulaSummary: [
      "GDP deflator = (Nominal GDP / Real GDP) \u00d7 100",
      "Real GDP = Nominal GDP / (Deflator / 100)",
      "Nominal GDP = Real GDP \u00d7 (Deflator / 100)",
    ],
    legend: t(
      "Enter any two values; the third is calculated. The deflator is an index number, not a percentage change.",
      "যেকোনো দুটি মান লিখুন; তৃতীয়টি গণনা করা হবে। ডিফ্লেটর একটি সূচক সংখ্যা, শতকরা পরিবর্তন নয়।",
    ),
    fields: [
      { key: "nominal", label: t("Nominal GDP", "নামমাত্র জিডিপি"), defaultValue: "1200", kind: "number" },
      { key: "real", label: t("Real GDP", "বাস্তব জিডিপি"), defaultValue: "1000", kind: "number" },
      { key: "deflator", label: t("GDP deflator (base = 100)", "জিডিপি ডিফ্লেটর (ভিত্তি = ১০০)"), defaultValue: "", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { nominal: "1200", real: "1000", deflator: "" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const nominal = optionalNumberField(input, "nominal", t("Nominal GDP", "নামমাত্র জিডিপি"));
      const real = optionalNumberField(input, "real", t("Real GDP", "বাস্তব জিডিপি"));
      const deflator = optionalNumberField(input, "deflator", t("The GDP deflator", "জিডিপি ডিফ্লেটর"));
      const supplied = [nominal, real, deflator].filter((value) => value !== null).length;
      if (supplied < 2) {
        throw new CalcInputError(
          t(
            "Enter at least two of the three values.",
            "তিনটি মানের মধ্যে অন্তত দুটি লিখুন।",
          ),
        );
      }
      if ((nominal !== null && nominal <= 0) || (real !== null && real <= 0) || (deflator !== null && deflator <= 0)) {
        throw new CalcInputError(
          t("GDP values and the deflator must be positive.", "জিডিপি ও ডিফ্লেটরের মান ধনাত্মক হতে হবে।"),
        );
      }
      const result = solveDeflator(nominal, real, deflator);

      return {
        metrics: [
          { label: t("Nominal GDP", "নামমাত্র জিডিপি"), value: formatNumber(result.nominal, 4) },
          { label: t("Real GDP", "বাস্তব জিডিপি"), value: formatNumber(result.real, 4) },
          { label: t("GDP deflator", "জিডিপি ডিফ্লেটর"), value: formatNumber(result.deflator, 4), tone: "brand" },
          {
            label: t("Calculated value", "গণনা করা মান"),
            value:
              result.solved === "deflator"
                ? t("GDP deflator", "জিডিপি ডিফ্লেটর")
                : result.solved === "real"
                  ? t("Real GDP", "বাস্তব জিডিপি")
                  : t("Nominal GDP", "নামমাত্র জিডিপি"),
          },
        ],
        steps: [
          {
            title: t("Deflator formula", "ডিফ্লেটরের সূত্র"),
            formula: "Deflator = (Nominal GDP / Real GDP) \u00d7 100",
            substitution: `Deflator = (${formatNumber(result.nominal, 3)} / ${formatNumber(result.real, 3)}) \u00d7 100 = ${formatNumber(result.deflator, 3)}`,
          },
          {
            title: t("Real GDP formula", "বাস্তব জিডিপির সূত্র"),
            formula: "Real GDP = Nominal GDP / (Deflator / 100)",
            substitution: `Real GDP = ${formatNumber(result.nominal, 3)} / (${formatNumber(result.deflator, 3)} / 100) = ${formatNumber(result.real, 3)}`,
          },
        ],
        interpretation: t(
          `At a deflator of ${formatNumber(result.deflator, 2)}, real GDP is ${formatNumber(result.real, 3)} and nominal GDP is ${formatNumber(result.nominal, 3)}. A deflator above 100 means prices are above the base-year level.`,
          `ডিফ্লেটর ${formatNumber(result.deflator, 2)}-এ বাস্তব জিডিপি ${formatNumber(result.real, 3)} এবং নামমাত্র জিডিপি ${formatNumber(result.nominal, 3)}। ১০০-এর বেশি ডিফ্লেটর মানে দাম ভিত্তি বছরের চেয়ে বেশি।`,
        ),
      };
    },
  },
  {
    id: "cpi-inflation",
    category: "macro",
    title: t("CPI inflation", "সিপিআই মূল্যস্ফীতি"),
    description: t(
      "Calculate period-by-period, total, and average inflation from a CPI series.",
      "সিপিআই সিরিজ থেকে প্রতি সময়ের, মোট ও গড় মূল্যস্ফীতি গণনা করুন।",
    ),
    whenToUse: t(
      "Use with a consumer price index that shares the same base and basket across periods.",
      "একই ভিত্তি ও ঝুড়িসহ ভোক্তা মূল্য সূচক থাকলে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The CPI series uses a consistent base and basket. Inflation is the percentage change in the index, not the change in the index points.",
      "সিপিআই সিরিজে একই ভিত্তি ও ঝুড়ি। মূল্যস্ফীতি সূচকের শতকরা পরিবর্তন, সূচক পয়েন্টের পরিবর্তন নয়।",
    ),
    formulaSummary: [
      "\u03c0_t = (CPI_t / CPI_{t\u22121}) \u2212 1",
      "Total inflation = CPI_last / CPI_first \u2212 1",
      "Average per period = (CPI_last / CPI_first)^(1/periods) \u2212 1",
    ],
    legend: t(
      "CPI = consumer price index; t = period; periods = number of intervals between the first and last observation.",
      "CPI = ভোক্তা মূল্য সূচক; t = সময়; periods = প্রথম ও শেষ পর্যবেক্ষণের মধ্যবর্তী বিরতির সংখ্যা।",
    ),
    fields: [],
    tables: [
      {
        key: "data",
        label: t("CPI series", "সিপিআই সিরিজ"),
        description: t(
          "Enter periods in order, from oldest to newest.",
          "সময়গুলো পুরোনো থেকে নতুন ক্রমে লিখুন।",
        ),
        columns: [{ key: "cpi", label: t("CPI", "সিপিআই") }],
        rowLabels: true,
        minRows: 2,
        maxRows: 200,
        initialRows: 5,
        addRowLabel: t("Add period", "সময় যোগ করুন"),
      },
    ],
    example: {
      fields: {},
      tables: {
        data: [
          ["2021", "100"],
          ["2022", "106"],
          ["2023", "115"],
          ["2024", "124"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const table = input.tables.data;
      if (!table) {
        throw new CalcInputError(t("The CPI table is missing.", "সিপিআই টেবিল পাওয়া যায়নি।"));
      }
      const observations: { period: string; cpi: number }[] = [];
      table.rows.forEach((row, index) => {
        if (isBlank(row[1])) return;
        const cpi = parseCell(row[1]);
        if (cpi === null || Number.isNaN(cpi) || cpi <= 0) {
          throw new CalcInputError(
            t(
              `Row ${index + 1}: CPI must be a positive number.`,
              `${index + 1} নম্বর সারি: সিপিআই ধনাত্মক সংখ্যা হতে হবে।`,
            ),
          );
        }
        observations.push({
          period: row[0]?.trim() || `Period ${observations.length + 1}`,
          cpi,
        });
      });
      if (observations.length < 2) {
        throw new CalcInputError(
          t("Enter at least two CPI observations.", "অন্তত দুটি সিপিআই পর্যবেক্ষণ লিখুন।"),
        );
      }
      const result = cpiInflation(observations);

      return {
        metrics: [
          { label: t("Observations", "পর্যবেক্ষণ"), value: String(observations.length) },
          { label: t("Total inflation", "মোট মূল্যস্ফীতি"), value: formatPercent(result.totalInflation), tone: "brand" },
          { label: t("Average per period", "প্রতি সময়ে গড়"), value: formatPercent(result.averageInflation) },
        ],
        tables: [
          {
            headers: ["Period", "CPI", "Inflation"],
            rows: result.rows.map((row) => [
              row.period,
              formatNumber(row.cpi, 3),
              row.inflation === null ? "\u2014" : formatPercent(row.inflation),
            ]),
            align: ["left", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Period inflation", "প্রতি সময়ের মূল্যস্ফীতি"),
            formula: "\u03c0_t = (CPI_t / CPI_{t\u22121}) \u2212 1",
            substitution: result.rows
              .filter((row) => row.inflation !== null)
              .slice(0, 3)
              .map((row, index) => {
                const previous = result.rows[index];
                return `${row.period}: (${formatNumber(row.cpi, 3)} / ${formatNumber(previous.cpi, 3)}) \u2212 1 = ${formatPercent(row.inflation ?? 0)}`;
              })
              .join("  \u00b7  "),
          },
          {
            title: t("Total and average", "মোট ও গড়"),
            formula: "Total = CPI_last / CPI_first \u2212 1",
            substitution: `Total = ${formatPercent(result.totalInflation)}; average per period = ${formatPercent(result.averageInflation)}`,
          },
        ],
        interpretation: t(
          `Prices rose ${formatPercent(result.totalInflation)} over the full series, an average of ${formatPercent(result.averageInflation)} per period.`,
          `পুরো সিরিজে দাম ${formatPercent(result.totalInflation)} বেড়েছে, প্রতি সময়ে গড়ে ${formatPercent(result.averageInflation)}।`,
        ),
      };
    },
  },
  {
    id: "growth-cagr",
    category: "macro",
    title: t("Growth rate & CAGR", "প্রবৃদ্ধির হার ও CAGR"),
    description: t(
      "Total growth, compound annual growth rate, and doubling time.",
      "মোট প্রবৃদ্ধি, যৌগিক বার্ষিক প্রবৃদ্ধি হার ও দ্বিগুণ হওয়ার সময়।",
    ),
    whenToUse: t(
      "Use for GDP, revenue, exports, population, or any value measured at two dates.",
      "জিডিপি, রাজস্ব, রপ্তানি, জনসংখ্যা বা দুই তারিখে মাপা যেকোনো মানের জন্য ব্যবহার করুন।",
    ),
    assumptions: t(
      "The beginning and ending values use the same definition and currency. CAGR smooths all intermediate fluctuations into one constant rate.",
      "শুরুর ও শেষের মান একই সংজ্ঞা ও মুদ্রার। CAGR মধ্যবর্তী সব ওঠাপড়াকে একটি ধ্রুবক হারে সমান করে।",
    ),
    formulaSummary: [
      "Total growth = (End / Begin) \u2212 1",
      "CAGR = (End / Begin)^(1/years) \u2212 1",
      "Doubling time = ln(2) / ln(1 + CAGR)",
    ],
    legend: t(
      "Begin = starting value; End = ending value; years = number of years between them.",
      "Begin = শুরুর মান; End = শেষের মান; years = মধ্যবর্তী বছরের সংখ্যা।",
    ),
    fields: [
      { key: "begin", label: t("Beginning value", "শুরুর মান"), defaultValue: "100", kind: "number" },
      { key: "end", label: t("Ending value", "শেষের মান"), defaultValue: "150", kind: "number" },
      { key: "years", label: t("Years", "বছর"), defaultValue: "5", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { begin: "100", end: "150", years: "5" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const begin = numberField(input, "begin", t("The beginning value", "শুরুর মান"));
      const end = numberField(input, "end", t("The ending value", "শেষের মান"));
      const years = numberField(input, "years", t("The number of years", "বছরের সংখ্যা"));
      if (begin <= 0 || end < 0) {
        throw new CalcInputError(
          t("Beginning value must be positive and ending value cannot be negative.", "শুরুর মান ধনাত্মক হতে হবে এবং শেষের মান ঋণাত্মক হতে পারবে না।"),
        );
      }
      if (years <= 0) {
        throw new CalcInputError(t("Years must be positive.", "বছর ধনাত্মক হতে হবে।"));
      }
      const result = growthRate(begin, end, years);

      return {
        metrics: [
          { label: t("Total growth", "মোট প্রবৃদ্ধি"), value: formatPercent(result.totalGrowth), tone: result.totalGrowth >= 0 ? "brand" : "warning" },
          { label: t("CAGR", "CAGR"), value: formatPercent(result.cagr), tone: result.cagr >= 0 ? "brand" : "warning" },
          {
            label: t("Doubling time", "দ্বিগুণ হওয়ার সময়"),
            value: result.doublingTime === null ? "\u2014" : `${formatNumber(result.doublingTime, 2)} years`,
          },
        ],
        steps: [
          {
            title: t("Total growth", "মোট প্রবৃদ্ধি"),
            formula: "Total = (End / Begin) \u2212 1",
            substitution: `Total = (${formatNumber(end, 3)} / ${formatNumber(begin, 3)}) \u2212 1 = ${formatPercent(result.totalGrowth)}`,
          },
          {
            title: t("Compound annual growth rate", "যৌগিক বার্ষিক প্রবৃদ্ধি হার"),
            formula: "CAGR = (End / Begin)^(1/years) \u2212 1",
            substitution: `CAGR = (${formatNumber(end, 3)} / ${formatNumber(begin, 3)})^(1/${formatNumber(years, 2)}) \u2212 1 = ${formatPercent(result.cagr)}`,
          },
          {
            title: t("Rule of 70 check", "৭০-এর নিয়ম যাচাই"),
            formula: "Doubling time \u2248 ln(2) / ln(1 + CAGR)",
            substitution: result.doublingTime === null ? "\u2014" : `${formatNumber(result.doublingTime, 2)} years`,
          },
        ],
        interpretation: t(
          `The value grew ${formatPercent(result.totalGrowth)} in total, equivalent to ${formatPercent(result.cagr)} per year compounded. At that rate it doubles in about ${result.doublingTime === null ? "\u2014" : `${formatNumber(result.doublingTime, 1)} years`}.`,
          `মানটি মোট ${formatPercent(result.totalGrowth)} বেড়েছে, যা বছরে যৌগিক ${formatPercent(result.cagr)}-এর সমান। এই হারে প্রায় ${result.doublingTime === null ? "\u2014" : `${formatNumber(result.doublingTime, 1)} বছরে`} দ্বিগুণ হবে।`,
        ),
      };
    },
  },
  {
    id: "gdp-per-capita",
    category: "macro",
    title: t("GDP per capita", "মাথাপিছু জিডিপি"),
    description: t(
      "Divide GDP by population to compare average output per person.",
      "মাথাপিছু গড় উৎপাদন তুলনা করতে জিডিপিকে জনসংখ্যা দিয়ে ভাগ করুন।",
    ),
    whenToUse: t(
      "Use to compare living standards or average productivity across countries or over time.",
      "দেশ বা সময়ের মধ্যে জীবনযাত্রার মান বা গড় উৎপাদনশীলতা তুলনা করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "GDP and population refer to the same year and territory. GDP per capita is an average, not the income of a typical person.",
      "জিডিপি ও জনসংখ্যা একই বছর ও ভূখণ্ডের। মাথাপিছু জিডিপি একটি গড়, সাধারণ ব্যক্তির আয় নয়।",
    ),
    formulaSummary: ["GDP per capita = GDP / Population"],
    legend: t(
      "Use the same currency and period for GDP and population.",
      "জিডিপি ও জনসংখ্যার জন্য একই মুদ্রা ও সময় ব্যবহার করুন।",
    ),
    fields: [
      { key: "gdp", label: t("GDP", "জিডিপি"), defaultValue: "450000000000", kind: "number" },
      { key: "population", label: t("Population", "জনসংখ্যা"), defaultValue: "170000000", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { gdp: "450000000000", population: "170000000" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const gdp = numberField(input, "gdp", t("GDP", "জিডিপি"));
      const population = numberField(input, "population", t("Population", "জনসংখ্যা"));
      if (gdp < 0 || population <= 0) {
        throw new CalcInputError(
          t("GDP cannot be negative and population must be positive.", "জিডিপি ঋণাত্মক হতে পারে না এবং জনসংখ্যা ধনাত্মক হতে হবে।"),
        );
      }
      const result = gdpPerCapita(gdp, population);
      return {
        metrics: [
          { label: t("GDP per capita", "মাথাপিছু জিডিপি"), value: formatNumber(result.gdpPerCapita, 2), tone: "brand" },
          { label: t("GDP", "জিডিপি"), value: formatNumber(result.gdp, 2) },
          { label: t("Population", "জনসংখ্যা"), value: formatNumber(result.population, 2) },
        ],
        steps: [
          {
            title: t("GDP per capita", "মাথাপিছু জিডিপি"),
            formula: "GDP per capita = GDP / Population",
            substitution: `${formatNumber(gdp, 2)} / ${formatNumber(population, 2)} = ${formatNumber(result.gdpPerCapita, 2)}`,
          },
        ],
        interpretation: t(
          `Average output per person is ${formatNumber(result.gdpPerCapita, 2)} in the currency used for GDP.`,
          `জিডিপিতে ব্যবহৃত মুদ্রায় মাথাপিছু গড় উৎপাদন ${formatNumber(result.gdpPerCapita, 2)}।`,
        ),
      };
    },
  },
  {
    id: "unemployment-rate",
    category: "macro",
    title: t("Unemployment rate", "বেকারত্বের হার"),
    description: t(
      "Unemployed workers as a share of the labour force, plus the employment rate.",
      "শ্রমশক্তির মধ্যে বেকারের অংশ, সঙ্গে কর্মসংস্থানের হার।",
    ),
    whenToUse: t(
      "Use with labour-force survey counts that follow the same definition of unemployment.",
      "বেকারত্বের একই সংজ্ঞা অনুসরণকারী শ্রমশক্তি জরিপের গণনার সঙ্গে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The unemployed are actively looking for work and are part of the labour force. People outside the labour force are excluded from both rates.",
      "বেকাররা সক্রিয়ভাবে কাজ খুঁজছে এবং শ্রমশক্তির অংশ। শ্রমশক্তির বাইরের মানুষ দুটি হার থেকেই বাদ।",
    ),
    formulaSummary: [
      "Unemployment rate = Unemployed / Labour force",
      "Employment rate = Employed / Labour force",
      "Employed = Labour force \u2212 Unemployed",
    ],
    legend: t(
      "Labour force = employed + unemployed. It excludes people not looking for work.",
      "শ্রমশক্তি = কর্মরত + বেকার। কাজ খুঁজছে না এমন মানুষ বাদ।",
    ),
    fields: [
      { key: "labour", label: t("Labour force", "শ্রমশক্তি"), defaultValue: "70000000", kind: "number" },
      { key: "unemployed", label: t("Unemployed", "বেকার"), defaultValue: "3500000", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { labour: "70000000", unemployed: "3500000" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const labour = numberField(input, "labour", t("The labour force", "শ্রমশক্তি"));
      const unemployed = numberField(input, "unemployed", t("Unemployed workers", "বেকার"));
      const result = unemploymentRate(labour, unemployed);
      return {
        metrics: [
          { label: t("Unemployment rate", "বেকারত্বের হার"), value: formatPercent(result.unemploymentRate), tone: "warning" },
          { label: t("Employment rate", "কর্মসংস্থানের হার"), value: formatPercent(result.employmentRate), tone: "brand" },
          { label: t("Employed", "কর্মরত"), value: formatNumber(result.employed, 2) },
        ],
        steps: [
          {
            title: t("Unemployment rate", "বেকারত্বের হার"),
            formula: "Unemployment rate = Unemployed / Labour force",
            substitution: `${formatNumber(unemployed, 2)} / ${formatNumber(labour, 2)} = ${formatPercent(result.unemploymentRate)}`,
          },
          {
            title: t("Employment rate", "কর্মসংস্থানের হার"),
            formula: "Employment rate = (Labour force \u2212 Unemployed) / Labour force",
            substitution: `${formatNumber(result.employed, 2)} / ${formatNumber(labour, 2)} = ${formatPercent(result.employmentRate)}`,
          },
        ],
        interpretation: t(
          `${formatPercent(result.unemploymentRate)} of the labour force is unemployed, leaving ${formatNumber(result.employed, 0)} employed workers.`,
          `শ্রমশক্তির ${formatPercent(result.unemploymentRate)} বেকার, ফলে ${formatNumber(result.employed, 0)} জন কর্মরত।`,
        ),
      };
    },
  },
  {
    id: "money-multiplier",
    category: "macro",
    title: t("Money multiplier", "মানি মাল্টিপ্লায়ার"),
    description: t(
      "The deposit multiplier implied by the reserve ratio, and the money supply it can support.",
      "রিজার্ভ অনুপাত থেকে প্রাপ্ত আমানত গুণক এবং এটি যে মুদ্রা সরবরাহ সমর্থন করতে পারে।",
    ),
    whenToUse: t(
      "Use as a simplified banking-sector model when the reserve ratio is known.",
      "রিজার্ভ অনুপাত জানা থাকলে সরলীকৃত ব্যাংকিং মডেল হিসেবে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Banks hold only required reserves, the public holds no extra cash, and there are no leakages. Real economies have smaller multipliers.",
      "ব্যাংক শুধু বাধ্যতামূলক রিজার্ভ রাখে, জনগণ অতিরিক্ত নগদ রাখে না এবং কোনো লিকেজ নেই। বাস্তব অর্থনীতিতে গুণক ছোট হয়।",
    ),
    formulaSummary: [
      "Money multiplier = 1 / reserve ratio",
      "Money supply = Reserves \u00d7 multiplier",
      "Created money = Money supply \u2212 Reserves",
    ],
    legend: t(
      "The reserve ratio is a decimal: a 10% requirement is 0.10.",
      "রিজার্ভ অনুপাত দশমিক: ১০% হলে 0.10।",
    ),
    fields: [
      { key: "ratio", label: t("Reserve ratio", "রিজার্ভ অনুপাত"), help: RATE_HELP, defaultValue: "0.10", kind: "number" },
      { key: "reserves", label: t("Reserves (optional)", "রিজার্ভ (ঐচ্ছিক)"), defaultValue: "1000", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { ratio: "0.10", reserves: "1000" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const ratio = numberField(input, "ratio", t("The reserve ratio", "রিজার্ভ অনুপাত"));
      const reserves = optionalNumberField(input, "reserves", t("Reserves", "রিজার্ভ"));
      const result = moneyMultiplier(ratio, reserves);
      return {
        metrics: [
          { label: t("Money multiplier", "মানি মাল্টিপ্লায়ার"), value: formatNumber(result.multiplier, 4), tone: "brand" },
          {
            label: t("Money supply", "মুদ্রা সরবরাহ"),
            value: result.moneySupply === null ? "\u2014" : formatNumber(result.moneySupply, 2),
          },
          {
            label: t("Money created", "সৃষ্ট মুদ্রা"),
            value: result.createdMoney === null ? "\u2014" : formatNumber(result.createdMoney, 2),
          },
        ],
        steps: [
          {
            title: t("Multiplier", "গুণক"),
            formula: "Multiplier = 1 / reserve ratio",
            substitution: `1 / ${formatNumber(ratio, 4)} = ${formatNumber(result.multiplier, 4)}`,
          },
          {
            title: t("Money supply", "মুদ্রা সরবরাহ"),
            formula: "Money supply = Reserves \u00d7 multiplier",
            substitution:
              reserves === null
                ? "\u2014"
                : `${formatNumber(reserves, 2)} \u00d7 ${formatNumber(result.multiplier, 4)} = ${formatNumber(result.moneySupply ?? 0, 2)}`,
          },
        ],
        interpretation: t(
          `A reserve ratio of ${formatPercent(ratio)} supports a money multiplier of ${formatNumber(result.multiplier, 2)}. Each unit of reserves can support ${formatNumber(result.multiplier, 2)} units of deposits in this simplified model.`,
          `${formatPercent(ratio)} রিজার্ভ অনুপাত ${formatNumber(result.multiplier, 2)} গুণক সমর্থন করে। এই সরলীকৃত মডেলে প্রতিটি একক রিজার্ভ ${formatNumber(result.multiplier, 2)} একক আমানত সমর্থন করতে পারে।`,
        ),
      };
    },
  },
  {
    id: "expenditure-multiplier",
    category: "macro",
    title: t("Expenditure multiplier", "ব্যয় গুণক"),
    description: t(
      "The Keynesian multiplier from the marginal propensity to consume, with an optional tax rate.",
      "প্রান্তিক ভোগপ্রবণতা থেকে কেইনসীয় গুণক, ঐচ্ছিক কর হারসহ।",
    ),
    whenToUse: t(
      "Use to estimate how a change in autonomous spending can affect equilibrium income in a simple model.",
      "সরল মডেলে স্বায়ত্তশাসিত ব্যয়ের পরিবর্তন ভারসাম্য আয়ে কতটা প্রভাব ফেলতে পারে তা অনুমান করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "A closed economy with a constant marginal propensity to consume, spare capacity, and a proportional tax rate. Real multipliers vary with imports and confidence.",
      "ধ্রুবক প্রান্তিক ভোগপ্রবণতাসহ বদ্ধ অর্থনীতি, অব্যবহৃত সক্ষমতা এবং আনুপাতিক কর হার। বাস্তব গুণক আমদানি ও আস্থার সঙ্গে বদলায়।",
    ),
    formulaSummary: [
      "Simple multiplier = 1 / (1 \u2212 MPC)",
      "With tax rate t: multiplier = 1 / [1 \u2212 MPC(1 \u2212 t)]",
      "\u0394Y = multiplier \u00d7 \u0394autonomous spending",
    ],
    legend: t(
      "MPC = marginal propensity to consume (0 to 1); t = tax rate as a decimal; \u0394Y = change in equilibrium income.",
      "MPC = প্রান্তিক ভোগপ্রবণতা (০ থেকে ১); t = দশমিক কর হার; \u0394Y = ভারসাম্য আয়ের পরিবর্তন।",
    ),
    fields: [
      { key: "mpc", label: t("Marginal propensity to consume (MPC)", "প্রান্তিক ভোগপ্রবণতা (MPC)"), defaultValue: "0.8", kind: "number" },
      { key: "tax", label: t("Tax rate (optional)", "কর হার (ঐচ্ছিক)"), help: RATE_HELP, defaultValue: "0.2", kind: "number" },
      { key: "change", label: t("Change in spending (optional)", "ব্যয়ের পরিবর্তন (ঐচ্ছিক)"), defaultValue: "100", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { mpc: "0.8", tax: "0.2", change: "100" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const mpc = numberField(input, "mpc", t("The marginal propensity to consume", "প্রান্তিক ভোগপ্রবণতা"));
      const tax = optionalNumberField(input, "tax", t("The tax rate", "কর হার"));
      const change = optionalNumberField(input, "change", t("The change in spending", "ব্যয়ের পরিবর্তন"));
      if (tax !== null && (tax < 0 || tax >= 1)) {
        throw new CalcInputError(
          t("The tax rate must be between 0 and 1.", "কর হার ০ ও ১-এর মধ্যে হতে হবে।"),
        );
      }
      const result = expenditureMultiplier(mpc, tax, change);
      return {
        metrics: [
          { label: t("Simple multiplier", "সরল গুণক"), value: formatNumber(result.simpleMultiplier, 4), tone: "brand" },
          {
            label: t("Multiplier with tax", "করসহ গুণক"),
            value: result.multiplierWithTax === null ? "\u2014" : formatNumber(result.multiplierWithTax, 4),
          },
          {
            label: t("Change in income", "আয়ের পরিবর্তন"),
            value: result.changeInIncome === null ? "\u2014" : formatNumber(result.changeInIncome, 3),
          },
          {
            label: t("Change with tax", "করসহ পরিবর্তন"),
            value: result.changeWithTax === null ? "\u2014" : formatNumber(result.changeWithTax, 3),
          },
        ],
        steps: [
          {
            title: t("Simple multiplier", "সরল গুণক"),
            formula: "Multiplier = 1 / (1 \u2212 MPC)",
            substitution: `1 / (1 \u2212 ${formatNumber(mpc, 3)}) = ${formatNumber(result.simpleMultiplier, 4)}`,
          },
          {
            title: t("With proportional tax", "আনুপাতিক করসহ"),
            formula: "Multiplier = 1 / [1 \u2212 MPC(1 \u2212 t)]",
            substitution:
              tax === null
                ? "\u2014"
                : `1 / [1 \u2212 ${formatNumber(mpc, 3)}(1 \u2212 ${formatNumber(tax, 3)})] = ${formatNumber(result.multiplierWithTax ?? 0, 4)}`,
          },
          {
            title: t("Income effect", "আয়ের প্রভাব"),
            formula: "\u0394Y = multiplier \u00d7 \u0394spending",
            substitution:
              change === null
                ? "\u2014"
                : `${formatNumber(result.simpleMultiplier, 3)} \u00d7 ${formatNumber(change, 3)} = ${formatNumber(result.changeInIncome ?? 0, 3)}`,
          },
        ],
        interpretation: t(
          `With MPC = ${formatNumber(mpc, 2)}, each extra unit of autonomous spending raises equilibrium income by ${formatNumber(result.simpleMultiplier, 2)} units in the simple model. A tax rate of ${tax === null ? "\u2014" : formatPercent(tax)} reduces that multiplier.`,
          `MPC = ${formatNumber(mpc, 2)} হলে সরল মডেলে স্বায়ত্তশাসিত ব্যয়ের প্রতিটি অতিরিক্ত একক ভারসাম্য আয় ${formatNumber(result.simpleMultiplier, 2)} একক বাড়ায়। কর হার ${tax === null ? "\u2014" : formatPercent(tax)} গুণক কমিয়ে দেয়।`,
        ),
      };
    },
  },
  {
    id: "fisher-equation",
    category: "macro",
    title: t("Fisher equation", "ফিশার সমীকরণ"),
    description: t(
      "Convert a nominal interest rate into a real rate using inflation.",
      "মূল্যস্ফীতি ব্যবহার করে নামমাত্র সুদের হারকে বাস্তব হারে রূপান্তর করুন।",
    ),
    whenToUse: t(
      "Use to compare returns or borrowing costs after inflation, especially when inflation is high.",
      "মূল্যস্ফীতির পর রিটার্ন বা ঋণের খরচ তুলনা করতে ব্যবহার করুন, বিশেষ করে উচ্চ মূল্যস্ফীতিতে।",
    ),
    assumptions: t(
      "The nominal rate and inflation refer to the same period. The exact version uses compounding; the approximate version is the familiar i \u2212 \u03c0.",
      "নামমাত্র হার ও মূল্যস্ফীতি একই সময়ের। সঠিক সংস্করণে যৌগিক গণনা; আনুমানিক সংস্করণ পরিচিত i \u2212 \u03c0।",
    ),
    formulaSummary: [
      "Exact: (1 + r) = (1 + i) / (1 + \u03c0)",
      "Approximate: r \u2248 i \u2212 \u03c0",
    ],
    legend: t(
      "i = nominal rate; \u03c0 = inflation rate; r = real rate. Enter all rates as decimals.",
      "i = নামমাত্র হার; \u03c0 = মূল্যস্ফীতি; r = বাস্তব হার। সব হার দশমিকে লিখুন।",
    ),
    fields: [
      { key: "nominal", label: t("Nominal interest rate", "নামমাত্র সুদের হার"), help: RATE_HELP, defaultValue: "0.10", kind: "number" },
      { key: "inflation", label: t("Inflation rate", "মূল্যস্ফীতির হার"), help: RATE_HELP, defaultValue: "0.06", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { nominal: "0.10", inflation: "0.06" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const nominal = numberField(input, "nominal", t("The nominal interest rate", "নামমাত্র সুদের হার"));
      const inflation = numberField(input, "inflation", t("The inflation rate", "মূল্যস্ফীতির হার"));
      const result = fisherEquation(nominal, inflation);
      return {
        metrics: [
          { label: t("Exact real rate", "সঠিক বাস্তব হার"), value: formatPercent(result.exactRealRate), tone: "brand" },
          { label: t("Approximate real rate", "আনুমানিক বাস্তব হার"), value: formatPercent(result.approximateRealRate) },
          { label: t("Nominal rate", "নামমাত্র হার"), value: formatPercent(result.nominalRate) },
          { label: t("Inflation", "মূল্যস্ফীতি"), value: formatPercent(result.inflationRate) },
        ],
        steps: [
          {
            title: t("Exact Fisher equation", "সঠিক ফিশার সমীকরণ"),
            formula: "r = (1 + i) / (1 + \u03c0) \u2212 1",
            substitution: `r = (1 + ${formatNumber(nominal, 4)}) / (1 + ${formatNumber(inflation, 4)}) \u2212 1 = ${formatPercent(result.exactRealRate)}`,
          },
          {
            title: t("Approximation", "আনুমানিক"),
            formula: "r \u2248 i \u2212 \u03c0",
            substitution: `${formatNumber(nominal, 4)} \u2212 ${formatNumber(inflation, 4)} = ${formatPercent(result.approximateRealRate)}`,
          },
        ],
        interpretation: t(
          `After inflation, the real return is ${formatPercent(result.exactRealRate)}. The simple i \u2212 \u03c0 approximation gives ${formatPercent(result.approximateRealRate)}; the gap grows when inflation is high.`,
          `মূল্যস্ফীতির পর বাস্তব রিটার্ন ${formatPercent(result.exactRealRate)}। সরল i \u2212 \u03c0 আনুমানিক মান ${formatPercent(result.approximateRealRate)}; মূল্যস্ফীতি বেশি হলে পার্থক্য বাড়ে।`,
        ),
      };
    },
  },
];
