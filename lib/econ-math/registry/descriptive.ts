import {
  formatNumber,
  getTable,
  isBlank,
  numericColumn,
  parseCell,
} from "@/lib/econ-math/io";
import { summarize, summarizeGrouped } from "@/lib/econ-math/descriptive";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorResult,
} from "@/lib/econ-math/types";

export const descriptiveCalculators: CalculatorDef[] = [
  {
    id: "summary-statistics",
    category: "descriptive",
    title: t("Summary statistics", "সারসংক্ষেপ পরিসংখ্যান"),
    description: t(
      "Mean, median, spread, quartiles, and shape for one or more variables.",
      "এক বা একাধিক চলকের গড়, মধ্যক, বিস্তার, চতুর্থাংশ এবং আকৃতি।",
    ),
    whenToUse: t(
      "Use this first to understand the centre and spread of a column of numbers before running a test or building a chart.",
      "পরীক্ষা বা চার্ট বানানোর আগে সংখ্যার একটি কলামের কেন্দ্র ও বিস্তার বুঝতে প্রথমে এটি ব্যবহার করুন।",
    ),
    assumptions: t(
      "The values are numeric observations from one sample. Blank cells are skipped. Skewness and kurtosis are sample-adjusted and need at least 4 observations.",
      "মানগুলো একটি নমুনার সংখ্যাগত পর্যবেক্ষণ। খালি ঘর বাদ দেওয়া হয়। স্কিউনেস ও কার্টোসিসের জন্য অন্তত ৪টি পর্যবেক্ষণ দরকার।",
    ),
    formulaSummary: [
      "x\u0304 = (\u03a3x) / n",
      "s\u00b2 = \u03a3(x \u2212 x\u0304)\u00b2 / (n \u2212 1)",
      "CV = s / |x\u0304|",
      "Quartiles use linear interpolation between ordered observations.",
      "Skewness = [n / ((n\u22121)(n\u22122))] \u03a3((x \u2212 x\u0304)/s)\u00b3",
    ],
    legend: t(
      "x\u0304 = sample mean; s = sample standard deviation; n = number of observations; CV = coefficient of variation.",
      "x\u0304 = নমুনার গড়; s = নমুনার আদর্শ বিচ্যুতি; n = পর্যবেক্ষণ সংখ্যা; CV = ভিন্নতা সহগ।",
    ),
    fields: [],
    tables: [
      {
        key: "data",
        label: t("Observation table", "পর্যবেক্ষণ টেবিল"),
        description: t(
          "Enter each variable in its own column. Add a column to compare variables side by side.",
          "প্রতিটি চলক আলাদা কলামে লিখুন। পাশাপাশি তুলনার জন্য কলাম যোগ করুন।",
        ),
        columns: [{ key: "variable-1", label: t("Variable 1", "চলক ১") }],
        dynamicColumns: true,
        minRows: 2,
        maxRows: 500,
        initialRows: 8,
        initialColumns: 1,
        addRowLabel: t("Add observation", "পর্যবেক্ষণ যোগ করুন"),
        addColumnLabel: t("Add variable", "চলক যোগ করুন"),
      },
    ],
    example: {
      fields: {},
      tables: {
        data: [
          ["42"],
          ["48"],
          ["51"],
          ["47"],
          ["55"],
          ["44"],
          ["50"],
          ["53"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const table = getTable(
        input,
        "data",
        t("Observation table", "পর্যবেক্ষণ টেবিল"),
      );
      const usedColumns = table.headers
        .map((header, index) => ({ header, index }))
        .filter(({ index }) =>
          table.rows.some((row) => !isBlank(row[index])),
        );

      if (usedColumns.length === 0) {
        throw new CalcInputError(
          t("Enter numbers in the table.", "টেবিলে সংখ্যা লিখুন।"),
        );
      }

      const summaries = usedColumns.map(({ header, index }) => {
        const values = numericColumn(
          input,
          "data",
          index,
          t("Observation table", "পর্যবেক্ষণ টেবিল"),
          t(header || `Variable ${index + 1}`, header || `চলক ${index + 1}`),
        );
        if (values.length < 2) {
          throw new CalcInputError(
            t(
              `${header || `Variable ${index + 1}`} needs at least two observations.`,
              `${header || `চলক ${index + 1}`}-এ অন্তত দুটি পর্যবেক্ষণ দরকার।`,
            ),
          );
        }
        return {
          header: header || `Variable ${index + 1}`,
          values,
          summary: summarize(values, true),
        };
      });

      const rows: string[][] = [
        ["n", ...summaries.map((item) => String(item.summary.n))],
        ["Sum", ...summaries.map((item) => formatNumber(item.summary.sum, 4))],
        ["Mean", ...summaries.map((item) => formatNumber(item.summary.mean, 4))],
        ["Median", ...summaries.map((item) => formatNumber(item.summary.median, 4))],
        [
          "Mode",
          ...summaries.map((item) =>
            item.summary.mode.length === 0
              ? "\u2014"
              : item.summary.mode.map((value) => formatNumber(value, 4)).join(", "),
          ),
        ],
        ["Minimum", ...summaries.map((item) => formatNumber(item.summary.min, 4))],
        ["Maximum", ...summaries.map((item) => formatNumber(item.summary.max, 4))],
        ["Range", ...summaries.map((item) => formatNumber(item.summary.range, 4))],
        ["Q1", ...summaries.map((item) => formatNumber(item.summary.q1, 4))],
        ["Q3", ...summaries.map((item) => formatNumber(item.summary.q3, 4))],
        ["IQR", ...summaries.map((item) => formatNumber(item.summary.iqr, 4))],
        [
          "Variance (sample)",
          ...summaries.map((item) =>
            item.summary.variance === null
              ? "\u2014"
              : formatNumber(item.summary.variance, 4),
          ),
        ],
        [
          "Standard deviation (sample)",
          ...summaries.map((item) =>
            item.summary.standardDeviation === null
              ? "\u2014"
              : formatNumber(item.summary.standardDeviation, 4),
          ),
        ],
        [
          "Coefficient of variation",
          ...summaries.map((item) =>
            item.summary.coefficientOfVariation === null
              ? "\u2014"
              : `${formatNumber(item.summary.coefficientOfVariation * 100, 2)}%`,
          ),
        ],
        [
          "Skewness",
          ...summaries.map((item) =>
            item.summary.skewness === null
              ? "\u2014"
              : formatNumber(item.summary.skewness, 4),
          ),
        ],
        [
          "Excess kurtosis",
          ...summaries.map((item) =>
            item.summary.kurtosis === null
              ? "\u2014"
              : formatNumber(item.summary.kurtosis, 4),
          ),
        ],
      ];

      const totalObservations = summaries.reduce(
        (running, item) => running + item.summary.n,
        0,
      );
      const missing = summaries.reduce(
        (running, item) =>
          running +
          (table.rows.length - item.values.length),
        0,
      );

      const warnings = [] as { en: string; bn: string }[];
      if (missing > 0) {
        warnings.push(
          t(
            `${missing} blank or skipped cell${missing === 1 ? "" : "s"} were not counted.`,
            `${missing}টি খালি ঘর গণনায় নেওয়া হয়নি।`,
          ),
        );
      }
      if (summaries.some((item) => item.summary.n < 4)) {
        warnings.push(
          t(
            "Skewness needs at least 3 observations and excess kurtosis needs at least 4; shorter columns show a dash.",
            "স্কিউনেসের জন্য অন্তত ৩টি এবং কার্টোসিসের জন্য অন্তত ৪টি পর্যবেক্ষণ দরকার; কম হলে ড্যাশ দেখানো হয়।",
          ),
        );
      }

      return {
        metrics: [
          {
            label: t("Variables", "চলক"),
            value: String(summaries.length),
          },
          {
            label: t("Observations used", "ব্যবহৃত পর্যবেক্ষণ"),
            value: String(totalObservations),
          },
        ],
        tables: [
          {
            headers: ["Statistic", ...summaries.map((item) => item.header)],
            rows,
            align: ["left", ...summaries.map(() => "right" as const)],
          },
        ],
        steps: [
          {
            title: t("Sample mean", "নমুনার গড়"),
            formula: "x\u0304 = (\u03a3x) / n",
            substitution: summaries
              .map(
                (item) =>
                  `${item.header}: ${formatNumber(item.summary.mean, 3)} = ${formatNumber(item.summary.sum, 3)} / ${item.summary.n}`,
              )
              .join("  \u00b7  "),
          },
          {
            title: t("Sample variance and standard deviation", "নমুনার ভ্যারিয়েন্স ও আদর্শ বিচ্যুতি"),
            formula: "s\u00b2 = \u03a3(x \u2212 x\u0304)\u00b2 / (n \u2212 1) ; s = \u221as\u00b2",
            note: t(
              "Dividing by n \u2212 1 gives the sample standard deviation. Use n only when the data are the whole population.",
              "n \u2212 1 দিয়ে ভাগ করলে নমুনার আদর্শ বিচ্যুতি পাওয়া যায়। পুরো জনসংখ্যা হলে শুধু n দিয়ে ভাগ করুন।",
            ),
          },
        ],
        interpretation: t(
          `The table describes ${summaries.length} variable${summaries.length === 1 ? "" : "s"} using ${totalObservations} observations. Compare the mean with the median to judge skew, and compare the standard deviation with the mean to judge relative variability.`,
          `টেবিলটি ${totalObservations}টি পর্যবেক্ষণ ব্যবহার করে ${summaries.length}টি চলক বর্ণনা করছে। স্কিউনেস বুঝতে গড় ও মধ্যক এবং আপেক্ষিক বিস্তার বুঝতে আদর্শ বিচ্যুতি ও গড় তুলনা করুন।`,
        ),
        warnings,
      };
    },
  },
  {
    id: "grouped-frequency",
    category: "descriptive",
    title: t("Grouped frequency statistics", "শ্রেণিবদ্ধ কম্পাঙ্ক পরিসংখ্যান"),
    description: t(
      "Mean, median, mode, and standard deviation from class intervals and frequencies.",
      "শ্রেণি ব্যবধান ও কম্পাঙ্ক থেকে গড়, মধ্যক, প্রচুরক ও আদর্শ বিচ্যুতি।",
    ),
    whenToUse: t(
      "Use this when the data arrive as a frequency table with class intervals rather than as individual observations.",
      "যখন আলাদা আলাদা পর্যবেক্ষণের বদলে শ্রেণি ব্যবধানসহ কম্পাঙ্ক টেবিলে ডেটা আসে, তখন এটি ব্যবহার করুন।",
    ),
    assumptions: t(
      "Classes should not overlap, should have equal widths where possible, and must not be open-ended. Calculations use class midpoints, so results are approximations.",
      "শ্রেণিগুলো ওভারল্যাপ হবে না, সম্ভব হলে সমান প্রস্থের হবে এবং খোলা প্রান্তের হবে না। গণনায় শ্রেণির মধ্যবিন্দু ব্যবহার হয়, তাই ফলাফল আনুমানিক।",
    ),
    formulaSummary: [
      "Mean = \u03a3fm / N (m = class midpoint)",
      "Median = L + [(N/2 \u2212 CF) / f] \u00d7 h",
      "Mode = L + [(f\u2081 \u2212 f\u2080) / (2f\u2081 \u2212 f\u2080 \u2212 f\u2082)] \u00d7 h",
      "s\u00b2 = \u03a3f(m \u2212 mean)\u00b2 / (N \u2212 1)",
    ],
    legend: t(
      "L = lower boundary of the median or modal class; CF = cumulative frequency before it; f = class frequency; h = class width; N = total frequency.",
      "L = মধ্যক বা প্রচুরক শ্রেণির নিম্নসীমা; CF = তার আগের ক্রমযোজিত কম্পাঙ্ক; f = শ্রেণির কম্পাঙ্ক; h = শ্রেণি প্রস্থ; N = মোট কম্পাঙ্ক।",
    ),
    fields: [],
    tables: [
      {
        key: "classes",
        label: t("Class intervals", "শ্রেণি ব্যবধান"),
        columns: [
          { key: "lower", label: t("Lower limit", "নিম্নসীমা") },
          { key: "upper", label: t("Upper limit", "ঊর্ধ্বসীমা") },
          { key: "frequency", label: t("Frequency", "কম্পাঙ্ক") },
        ],
        minRows: 1,
        maxRows: 100,
        initialRows: 5,
        addRowLabel: t("Add class", "শ্রেণি যোগ করুন"),
      },
    ],
    example: {
      fields: {},
      tables: {
        classes: [
          ["0", "10", "5"],
          ["10", "20", "8"],
          ["20", "30", "14"],
          ["30", "40", "9"],
          ["40", "50", "4"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const table = getTable(input, "classes", t("Class intervals", "শ্রেণি ব্যবধান"));
      const classes: { lower: number; upper: number; frequency: number }[] = [];

      table.rows.forEach((row, index) => {
        if (row.every((cell) => isBlank(cell))) return;
        const lower = parseCell(row[0]);
        const upper = parseCell(row[1]);
        const frequency = parseCell(row[2]);

        if (
          lower === null ||
          upper === null ||
          frequency === null ||
          Number.isNaN(lower) ||
          Number.isNaN(upper) ||
          Number.isNaN(frequency)
        ) {
          throw new CalcInputError(
            t(
              `Class ${index + 1} needs numeric lower, upper, and frequency values.`,
              `${index + 1} নম্বর শ্রেণিতে সংখ্যাগত নিম্নসীমা, ঊর্ধ্বসীমা ও কম্পাঙ্ক দরকার।`,
            ),
          );
        }
        if (upper <= lower) {
          throw new CalcInputError(
            t(
              `Class ${index + 1}: the upper limit must be greater than the lower limit.`,
              `${index + 1} নম্বর শ্রেণি: ঊর্ধ্বসীমা নিম্নসীমার চেয়ে বড় হতে হবে।`,
            ),
          );
        }
        if (frequency <= 0) {
          throw new CalcInputError(
            t(
              `Class ${index + 1}: frequency must be positive.`,
              `${index + 1} নম্বর শ্রেণি: কম্পাঙ্ক ধনাত্মক হতে হবে।`,
            ),
          );
        }
        classes.push({ lower, upper, frequency });
      });

      if (classes.length === 0) {
        throw new CalcInputError(
          t("Enter at least one class.", "অন্তত একটি শ্রেণি লিখুন।"),
        );
      }

      const summary = summarizeGrouped(classes);
      const widths = new Set(classes.map((row) => row.upper - row.lower));
      const warnings = [] as { en: string; bn: string }[];
      if (widths.size > 1) {
        warnings.push(
          t(
            "The class widths are not equal. The midpoint formulas still work, but the histogram and interpolation are less precise.",
            "শ্রেণি প্রস্থ সমান নয়। মধ্যবিন্দুর সূত্র কাজ করে, তবে হিস্টোগ্রাম ও ইন্টারপোলেশন কম নির্ভুল।",
          ),
        );
      }

      return {
        metrics: [
          { label: t("Total frequency (N)", "মোট কম্পাঙ্ক (N)"), value: String(summary.n) },
          { label: t("Mean", "গড়"), value: formatNumber(summary.mean, 4) },
          {
            label: t("Median", "মধ্যক"),
            value: summary.median === null ? "\u2014" : formatNumber(summary.median, 4),
          },
          {
            label: t("Mode", "প্রচুরক"),
            value: summary.mode === null ? "\u2014" : formatNumber(summary.mode, 4),
          },
          {
            label: t("Variance (sample)", "ভ্যারিয়েন্স (নমুনা)"),
            value:
              summary.variance === null ? "\u2014" : formatNumber(summary.variance, 4),
          },
          {
            label: t("Standard deviation", "আদর্শ বিচ্যুতি"),
            value:
              summary.standardDeviation === null
                ? "\u2014"
                : formatNumber(summary.standardDeviation, 4),
          },
        ],
        tables: [
          {
            headers: [
              "Class",
              "Midpoint",
              "Frequency",
              "Cumulative",
            ],
            rows: summary.rows.map((row) => [
              `${formatNumber(row.lower, 4)} \u2013 ${formatNumber(row.upper, 4)}`,
              formatNumber(row.midpoint, 4),
              String(row.frequency),
              String(row.cumulative),
            ]),
            align: ["left", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Grouped mean", "শ্রেণিবদ্ধ গড়"),
            formula: "Mean = \u03a3fm / N",
            substitution: `Mean = ${formatNumber(
              summary.rows.reduce((running, row) => running + row.midpoint * row.frequency, 0),
              3,
            )} / ${summary.n} = ${formatNumber(summary.mean, 3)}`,
          },
          {
            title: t("Median class", "মধ্যক শ্রেণি"),
            formula: "Median = L + [(N/2 \u2212 CF) / f] \u00d7 h",
            substitution:
              summary.median === null
                ? "\u2014"
                : `Median = ${formatNumber(summary.median, 3)}`,
          },
          {
            title: t("Modal class", "প্রচুরক শ্রেণি"),
            formula: "Mode = L + [(f\u2081 \u2212 f\u2080) / (2f\u2081 \u2212 f\u2080 \u2212 f\u2082)] \u00d7 h",
            substitution:
              summary.mode === null
                ? "\u2014"
                : `Mode = ${formatNumber(summary.mode, 3)}`,
          },
        ],
        interpretation: t(
          `The grouped data contain ${summary.n} observations across ${classes.length} classes. The mean uses class midpoints, so it is an approximation of the original ungrouped mean.`,
          `শ্রেণিবদ্ধ ডেটায় ${classes.length}টি শ্রেণিতে ${summary.n}টি পর্যবেক্ষণ আছে। গড়ে শ্রেণির মধ্যবিন্দু ব্যবহার হয়, তাই এটি মূল অবিন্যস্ত গড়ের আনুমানিক মান।`,
        ),
        warnings,
      };
    },
  },
];
