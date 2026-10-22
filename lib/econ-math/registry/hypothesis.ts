import {
  fCritical,
  studentTQuantile,
  zCritical,
} from "@/lib/econ-math/distributions";
import {
  formatNumber,
  isBlank,
  labelledMatrix,
  numberField,
  numericColumn,
  pairedColumns,
  parseCell,
} from "@/lib/econ-math/io";
import {
  ALPHA_FIELD,
  TAILS_FIELD,
  YES_NO_OPTIONS,
  ciMetric,
  conclusion,
  decision,
  decisionMetric,
  nullHypothesis,
  pMetric,
  sampleSizeMetric,
} from "@/lib/econ-math/shared";
import {
  chiSquareGoodnessOfFit,
  chiSquareIndependence,
  oneSampleT,
  oneSampleZ,
  oneWayAnova,
  pairedT,
  twoProportionZ,
  twoSampleT,
  varianceFTest,
  type Tails,
} from "@/lib/econ-math/tests";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorInput,
  type CalculatorResult,
} from "@/lib/econ-math/types";

function getAlpha(input: CalculatorInput): number {
  const alpha = numberField(
    input,
    "alpha",
    t("The significance level (alpha)", "তাৎপর্য স্তর (আলফা)"),
  );
  if (alpha <= 0 || alpha >= 1) {
    throw new CalcInputError(
      t(
        "The significance level must be between 0 and 1.",
        "তাৎপর্য স্তর ০ ও ১-এর মধ্যে হতে হবে।",
      ),
    );
  }
  return alpha;
}

function getTails(input: CalculatorInput): Tails {
  const value = input.fields.tails;
  if (value === "greater" || value === "less") return value;
  return "two-sided";
}

function tailLabel(tails: Tails): string {
  if (tails === "greater") return ">";
  if (tails === "less") return "<";
  return "\u2260";
}

function twoColumnTable(
  label: string,
  labelBn: string,
  first: string,
  firstBn: string,
  second: string,
  secondBn: string,
) {
  return {
    key: "data",
    label: t(label, labelBn),
    columns: [
      { key: "first", label: t(first, firstBn) },
      { key: "second", label: t(second, secondBn) },
    ],
    minRows: 2,
    maxRows: 500,
    initialRows: 8,
    addRowLabel: t("Add row", "সারি যোগ করুন"),
  };
}

const ONE_COLUMN_TABLE = {
  key: "data",
  label: t("Observations", "পর্যবেক্ষণ"),
  description: t(
    "Paste a column from Excel or type one value per row.",
    "এক্সেল থেকে একটি কলাম পেস্ট করুন বা প্রতি সারিতে একটি মান লিখুন।",
  ),
  columns: [{ key: "value", label: t("Value", "মান") }],
  minRows: 2,
  maxRows: 500,
  initialRows: 8,
  addRowLabel: t("Add row", "সারি যোগ করুন"),
};

export const hypothesisCalculators: CalculatorDef[] = [
  {
    id: "z-test-mean",
    category: "hypothesis",
    title: t("One-sample Z-test (mean)", "এক-নমুনা Z-পরীক্ষা (গড়)"),
    description: t(
      "Compare a sample mean with a hypothesised mean when the population standard deviation is known.",
      "জনসংখ্যার আদর্শ বিচ্যুতি জানা থাকলে নমুনার গড়কে অনুমিত গড়ের সঙ্গে তুলনা করুন।",
    ),
    whenToUse: t(
      "Use when the population standard deviation is known, or when the sample is large (roughly n \u2265 30). Otherwise use the one-sample t-test.",
      "জনসংখ্যার আদর্শ বিচ্যুতি জানা থাকলে বা নমুনা বড় হলে (প্রায় n \u2265 30) ব্যবহার করুন। অন্যথায় এক-নমুনা t-পরীক্ষা ব্যবহার করুন।",
    ),
    assumptions: t(
      "Observations are independent, the sample is random, and the population standard deviation is known. A large sample makes the normal approximation safer.",
      "পর্যবেক্ষণগুলো স্বাধীন, নমুনাটি এলোমেলো এবং জনসংখ্যার আদর্শ বিচ্যুতি জানা। বড় নমুনায় স্বাভাবিক অনুমান বেশি নিরাপদ।",
    ),
    formulaSummary: ["z = (x\u0304 \u2212 \u03bc\u2080) / (\u03c3 / \u221an)"],
    legend: t(
      "x\u0304 = sample mean; \u03bc\u2080 = hypothesised mean; \u03c3 = known population standard deviation; n = sample size.",
      "x\u0304 = নমুনার গড়; \u03bc\u2080 = অনুমিত গড়; \u03c3 = জানা জনসংখ্যার আদর্শ বিচ্যুতি; n = নমুনার আকার।",
    ),
    fields: [
      {
        key: "mu",
        label: t("Hypothesised mean (\u03bc\u2080)", "অনুমিত গড় (\u03bc\u2080)"),
        defaultValue: "50",
        kind: "number",
      },
      {
        key: "sigma",
        label: t("Known population SD (\u03c3)", "জানা জনসংখ্যার আদর্শ বিচ্যুতি (\u03c3)"),
        defaultValue: "10",
        kind: "number",
      },
      ALPHA_FIELD,
      TAILS_FIELD,
    ],
    tables: [ONE_COLUMN_TABLE],
    example: {
      fields: { mu: "50", sigma: "10", alpha: "0.05", tails: "two-sided" },
      tables: {
        data: [["52"], ["48"], ["55"], ["51"], ["49"], ["53"], ["50"], ["54"]],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const tails = getTails(input);
      const mu = numberField(input, "mu", t("The hypothesised mean", "অনুমিত গড়"));
      const sigma = numberField(
        input,
        "sigma",
        t("The population standard deviation", "জনসংখ্যার আদর্শ বিচ্যুতি"),
      );
      if (sigma <= 0) {
        throw new CalcInputError(
          t("The population standard deviation must be positive.", "জনসংখ্যার আদর্শ বিচ্যুতি ধনাত্মক হতে হবে।"),
        );
      }
      const values = numericColumn(
        input,
        "data",
        0,
        t("Observations", "পর্যবেক্ষণ"),
        t("Value", "মান"),
      );
      if (values.length < 2) {
        throw new CalcInputError(
          t("Enter at least two observations.", "অন্তত দুটি পর্যবেক্ষণ লিখুন।"),
        );
      }
      const result = oneSampleZ(values, mu, sigma, alpha, tails);
      const info = decision(result.pValue, alpha);
      const critical = zCritical(alpha, tails === "two-sided" ? 2 : 1);

      return {
        metrics: [
          sampleSizeMetric(result.n),
          { label: t("Sample mean (x\u0304)", "নমুনার গড় (x\u0304)"), value: formatNumber(result.mean, 4) },
          { label: t("Standard error", "আদর্শ ত্রুটি"), value: formatNumber(result.standardError, 4) },
          { label: t("Z statistic", "Z পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          pMetric(result.pValue),
          {
            label: t("Critical value", "সংকট মান"),
            value: `${tails === "two-sided" ? "\u00b1" : ""}${formatNumber(critical, 4)}`,
          },
          ciMetric(result.confidenceInterval),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula: nullHypothesis("\u03bc", formatNumber(mu, 4), tails),
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "z = (x\u0304 \u2212 \u03bc\u2080) / (\u03c3 / \u221an)",
            substitution: `z = (${formatNumber(result.mean, 3)} \u2212 ${formatNumber(mu, 3)}) / (${formatNumber(sigma, 3)} / \u221a${result.n}) = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("p-value", "p-মান"),
            formula: `p = P(|Z| ${tailLabel(tails)} |z|)`,
            substitution: `p = ${formatNumber(result.pValue, 4)} (two-sided or one-sided as selected)`,
            note: t(
              `At \u03b1 = ${formatNumber(alpha, 3)}, ${info.rejected ? "reject" : "do not reject"} H\u2080.`,
              `\u03b1 = ${formatNumber(alpha, 3)}-এ H\u2080 ${info.rejected ? "প্রত্যাখ্যান করুন" : "প্রত্যাখ্যান করবেন না"}।`,
            ),
          },
        ],
        interpretation: t(
          `The sample mean is ${formatNumber(result.mean, 3)} against a hypothesised ${formatNumber(mu, 3)}. ${conclusion(info).en}`,
          `নমুনার গড় ${formatNumber(result.mean, 3)}, অনুমিত গড় ${formatNumber(mu, 3)}। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings:
          result.n < 30
            ? [
                t(
                  "With fewer than 30 observations the normal approximation may be weak; a t-test is usually safer unless \u03c3 is genuinely known.",
                  "৩০-এর কম পর্যবেক্ষণে স্বাভাবিক অনুমান দুর্বল হতে পারে; \u03c3 সত্যিই জানা না থাকলে সাধারণত t-পরীক্ষা নিরাপদ।",
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "t-test-one",
    category: "hypothesis",
    title: t("One-sample t-test", "এক-নমুনা t-পরীক্ষা"),
    description: t(
      "Compare a sample mean with a hypothesised mean when the population standard deviation is unknown.",
      "জনসংখ্যার আদর্শ বিচ্যুতি অজানা থাকলে নমুনার গড়কে অনুমিত গড়ের সঙ্গে তুলনা করুন।",
    ),
    whenToUse: t(
      "Use for a small or moderate sample from an approximately normal population when \u03c3 is estimated from the data.",
      "প্রায় স্বাভাবিক জনসংখ্যা থেকে ছোট বা মাঝারি নমুনায়, যখন \u03c3 ডেটা থেকে অনুমান করা হয়, তখন ব্যবহার করুন।",
    ),
    assumptions: t(
      "Independent random observations and an approximately normal distribution, especially for small samples. Outliers can distort the result.",
      "স্বাধীন এলোমেলো পর্যবেক্ষণ এবং বিশেষ করে ছোট নমুনায় প্রায় স্বাভাবিক বিন্যাস। চরম মান ফলাফল বিকৃত করতে পারে।",
    ),
    formulaSummary: [
      "t = (x\u0304 \u2212 \u03bc\u2080) / (s / \u221an)",
      "df = n \u2212 1",
      "Cohen's d = (x\u0304 \u2212 \u03bc\u2080) / s",
    ],
    legend: t(
      "x\u0304 = sample mean; \u03bc\u2080 = hypothesised mean; s = sample standard deviation; n = sample size.",
      "x\u0304 = নমুনার গড়; \u03bc\u2080 = অনুমিত গড়; s = নমুনার আদর্শ বিচ্যুতি; n = নমুনার আকার।",
    ),
    fields: [
      {
        key: "mu",
        label: t("Hypothesised mean (\u03bc\u2080)", "অনুমিত গড় (\u03bc\u2080)"),
        defaultValue: "50",
        kind: "number",
      },
      ALPHA_FIELD,
      TAILS_FIELD,
    ],
    tables: [ONE_COLUMN_TABLE],
    example: {
      fields: { mu: "50", alpha: "0.05", tails: "two-sided" },
      tables: {
        data: [["52"], ["48"], ["55"], ["51"], ["49"], ["53"], ["50"], ["54"]],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const tails = getTails(input);
      const mu = numberField(input, "mu", t("The hypothesised mean", "অনুমিত গড়"));
      const values = numericColumn(
        input,
        "data",
        0,
        t("Observations", "পর্যবেক্ষণ"),
        t("Value", "মান"),
      );
      if (values.length < 2) {
        throw new CalcInputError(
          t("Enter at least two observations.", "অন্তত দুটি পর্যবেক্ষণ লিখুন।"),
        );
      }
      const result = oneSampleT(values, mu, alpha, tails);
      const info = decision(result.pValue, alpha);
      const critical = studentTQuantile(
        1 - alpha / (tails === "two-sided" ? 2 : 1),
        result.df,
      );

      return {
        metrics: [
          sampleSizeMetric(result.n),
          { label: t("Sample mean (x\u0304)", "নমুনার গড় (x\u0304)"), value: formatNumber(result.mean, 4) },
          { label: t("Sample SD (s)", "নমুনার আদর্শ বিচ্যুতি (s)"), value: formatNumber(result.standardDeviation, 4) },
          { label: t("t statistic", "t পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: formatNumber(result.df, 3) },
          pMetric(result.pValue),
          {
            label: t("Critical value", "সংকট মান"),
            value: `${tails === "two-sided" ? "\u00b1" : ""}${formatNumber(critical, 4)}`,
          },
          ciMetric(result.confidenceInterval),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula: nullHypothesis("\u03bc", formatNumber(mu, 4), tails),
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "t = (x\u0304 \u2212 \u03bc\u2080) / (s / \u221an)",
            substitution: `t = (${formatNumber(result.mean, 3)} \u2212 ${formatNumber(mu, 3)}) / (${formatNumber(result.standardDeviation, 3)} / \u221a${result.n}) = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("Degrees of freedom", "স্বাধীনতার মাত্রা"),
            formula: "df = n \u2212 1",
            substitution: `df = ${result.n} \u2212 1 = ${result.df}`,
          },
          {
            title: t("Decision rule", "সিদ্ধান্তের নিয়ম"),
            formula: `|t| ${tailLabel(tails)} t(critical) or p < \u03b1`,
            substitution: `|${formatNumber(result.statistic, 3)}| vs ${formatNumber(Math.abs(critical), 3)}; p = ${formatNumber(result.pValue, 4)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The sample mean differs from ${formatNumber(mu, 3)} by ${formatNumber(result.mean - mu, 3)}. ${conclusion(info).en}`,
          `নমুনার গড় ${formatNumber(mu, 3)} থেকে ${formatNumber(result.mean - mu, 3)} ভিন্ন। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings:
          result.n < 30
            ? [
                t(
                  "Small samples rely heavily on the normal-population assumption. Check a dot plot or histogram for strong skew and outliers.",
                  "ছোট নমুনা স্বাভাবিক বিন্যাসের অনুমানের ওপর বেশি নির্ভর করে। তীব্র স্কিউনেস ও চরম মানের জন্য ডট প্লট বা হিস্টোগ্রাম দেখুন।",
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "t-test-two",
    category: "hypothesis",
    title: t("Two-sample t-test", "দুই-নমুনা t-পরীক্ষা"),
    description: t(
      "Compare the means of two independent groups. Choose Welch (unequal variances) or the pooled-variance version.",
      "দুটি স্বাধীন গ্রুপের গড় তুলনা করুন। Welch (অসম ভ্যারিয়েন্স) অথবা pooled-ভ্যারিয়েন্স সংস্করণ বেছে নিন।",
    ),
    whenToUse: t(
      "Use when two separate groups are measured on the same variable and you want to know whether their population means differ.",
      "দুটি আলাদা গ্রুপে একই চলক মাপা হলে এবং তাদের জনসংখ্যার গড় ভিন্ন কিনা জানতে চাইলে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The two samples are independent, each is roughly normal (especially when small), and the pooled version assumes equal population variances. Welch is the safer default.",
      "দুটি নমুনা স্বাধীন, প্রতিটি প্রায় স্বাভাবিক (বিশেষ করে ছোট হলে), এবং pooled সংস্করণে সমান জনসংখ্যা ভ্যারিয়েন্স ধরা হয়। Welch নিরাপদ ডিফল্ট।",
    ),
    formulaSummary: [
      "t = (x\u0304\u2081 \u2212 x\u0304\u2082) / \u221a(s\u2081\u00b2/n\u2081 + s\u2082\u00b2/n\u2082)  (Welch)",
      "t = (x\u0304\u2081 \u2212 x\u0304\u2082) / \u221a(sp\u00b2(1/n\u2081 + 1/n\u2082))  (pooled)",
      "df(Welch) = (s\u2081\u00b2/n\u2081 + s\u2082\u00b2/n\u2082)\u00b2 / [(s\u2081\u00b2/n\u2081)\u00b2/(n\u2081\u22121) + (s\u2082\u00b2/n\u2082)\u00b2/(n\u2082\u22121)]",
    ],
    legend: t(
      "x\u0304 = group mean; s\u00b2 = group variance; n = group size; sp\u00b2 = pooled variance. Blank cells are allowed because groups may have different lengths.",
      "x\u0304 = গ্রুপের গড়; s\u00b2 = গ্রুপের ভ্যারিয়েন্স; n = গ্রুপের আকার; sp\u00b2 = pooled ভ্যারিয়েন্স। গ্রুপের দৈর্ঘ্য ভিন্ন হতে পারে বলে খালি ঘর অনুমোদিত।",
    ),
    fields: [
      {
        key: "variance",
        label: t("Variance assumption", "ভ্যারিয়েন্স অনুমান"),
        defaultValue: "welch",
        kind: "select",
        options: [
          { value: "welch", label: t("Welch (unequal variances)", "Welch (অসম ভ্যারিয়েন্স)") },
          { value: "pooled", label: t("Pooled (equal variances)", "Pooled (সমান ভ্যারিয়েন্স)") },
        ],
      },
      ALPHA_FIELD,
      TAILS_FIELD,
    ],
    tables: [
      twoColumnTable(
        "Group observations",
        "গ্রুপের পর্যবেক্ষণ",
        "Group A",
        "গ্রুপ A",
        "Group B",
        "গ্রুপ B",
      ),
    ],
    example: {
      fields: { variance: "welch", alpha: "0.05", tails: "two-sided" },
      tables: {
        data: [
          ["12", "15"],
          ["14", "16"],
          ["13", "18"],
          ["15", "17"],
          ["16", "19"],
          ["14", "16"],
          ["13", "18"],
          ["15", "17"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const tails = getTails(input);
      const pooled = input.fields.variance === "pooled";
      const first = numericColumn(
        input,
        "data",
        0,
        t("Group observations", "গ্রুপের পর্যবেক্ষণ"),
        t("Group A", "গ্রুপ A"),
      );
      const second = numericColumn(
        input,
        "data",
        1,
        t("Group observations", "গ্রুপের পর্যবেক্ষণ"),
        t("Group B", "গ্রুপ B"),
      );
      if (first.length < 2 || second.length < 2) {
        throw new CalcInputError(
          t("Each group needs at least two observations.", "প্রতিটি গ্রুপে অন্তত দুটি পর্যবেক্ষণ দরকার।"),
        );
      }
      const result = twoSampleT(first, second, alpha, tails, pooled);
      const info = decision(result.pValue, alpha);
      const critical = studentTQuantile(
        1 - alpha / (tails === "two-sided" ? 2 : 1),
        result.df,
      );

      return {
        metrics: [
          { label: t("Group A size", "গ্রুপ A আকার"), value: String(result.n1) },
          { label: t("Group B size", "গ্রুপ B আকার"), value: String(result.n2) },
          { label: t("Mean A", "গড় A"), value: formatNumber(result.mean1, 4) },
          { label: t("Mean B", "গড় B"), value: formatNumber(result.mean2, 4) },
          { label: t("Difference (A \u2212 B)", "পার্থক্য (A \u2212 B)"), value: formatNumber(result.difference, 4) },
          { label: t("t statistic", "t পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: formatNumber(result.df, 3) },
          pMetric(result.pValue),
          {
            label: t("Critical value", "সংকট মান"),
            value: `${tails === "two-sided" ? "\u00b1" : ""}${formatNumber(critical, 4)}`,
          },
          ciMetric(result.confidenceInterval),
          {
            label: t("Cohen's d", "কোহেনস d"),
            value: result.effectSize === null ? "\u2014" : formatNumber(result.effectSize, 3),
          },
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              tails === "two-sided"
                ? "H\u2080: \u03bc\u2081 \u2212 \u03bc\u2082 = 0 ; H\u2081: \u03bc\u2081 \u2212 \u03bc\u2082 \u2260 0"
                : tails === "greater"
                  ? "H\u2080: \u03bc\u2081 \u2212 \u03bc\u2082 \u2264 0 ; H\u2081: \u03bc\u2081 \u2212 \u03bc\u2082 > 0"
                  : "H\u2080: \u03bc\u2081 \u2212 \u03bc\u2082 \u2265 0 ; H\u2081: \u03bc\u2081 \u2212 \u03bc\u2082 < 0",
          },
          {
            title: t("Standard error", "আদর্শ ত্রুটি"),
            formula: pooled
              ? "sp\u00b2 = [(n\u2081\u22121)s\u2081\u00b2 + (n\u2082\u22121)s\u2082\u00b2] / (n\u2081+n\u2082\u22122) ; SE = \u221a(sp\u00b2(1/n\u2081 + 1/n\u2082))"
              : "SE = \u221a(s\u2081\u00b2/n\u2081 + s\u2082\u00b2/n\u2082)",
            substitution: `SE = ${formatNumber(result.standardError, 3)}`,
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "t = (x\u0304\u2081 \u2212 x\u0304\u2082) / SE",
            substitution: `t = (${formatNumber(result.mean1, 3)} \u2212 ${formatNumber(result.mean2, 3)}) / ${formatNumber(result.standardError, 3)} = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("Degrees of freedom", "স্বাধীনতার মাত্রা"),
            formula: pooled ? "df = n\u2081 + n\u2082 \u2212 2" : "Welch\u2013Satterthwaite approximation",
            substitution: `df = ${formatNumber(result.df, 3)}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `Group A averages ${formatNumber(result.mean1, 3)} and Group B averages ${formatNumber(result.mean2, 3)}, a difference of ${formatNumber(result.difference, 3)}. ${conclusion(info).en}`,
          `গ্রুপ A-এর গড় ${formatNumber(result.mean1, 3)} এবং গ্রুপ B-এর গড় ${formatNumber(result.mean2, 3)}, পার্থক্য ${formatNumber(result.difference, 3)}। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings: [
          ...(result.n1 < 30 || result.n2 < 30
            ? [
                t(
                  "At least one group has fewer than 30 observations. Check for strong skew and outliers before relying on the t approximation.",
                  "অন্তত একটি গ্রুপে ৩০-এর কম পর্যবেক্ষণ আছে। t অনুমানের ওপর নির্ভর করার আগে তীব্র স্কিউনেস ও চরম মান যাচাই করুন।",
                ),
              ]
            : []),
          ...(pooled
            ? [
                t(
                  "The pooled version assumes equal population variances. If the two sample standard deviations are very different, use Welch.",
                  "Pooled সংস্করণে সমান জনসংখ্যা ভ্যারিয়েন্স ধরা হয়। দুই নমুনার আদর্শ বিচ্যুতি খুব ভিন্ন হলে Welch ব্যবহার করুন।",
                ),
              ]
            : []),
        ],
      };
    },
  },
  {
    id: "t-test-paired",
    category: "hypothesis",
    title: t("Paired t-test", "জোড়া t-পরীক্ষা"),
    description: t(
      "Compare two measurements taken on the same subjects, such as before and after.",
      "একই বিষয়ের ওপর দুটি পরিমাপ তুলনা করুন, যেমন আগে ও পরে।",
    ),
    whenToUse: t(
      "Use when every row contains a matched pair and you care about the average within-pair difference.",
      "প্রতিটি সারিতে মিলিত জোড়া থাকলে এবং জোড়ার ভেতরের গড় পার্থক্য জানতে চাইলে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The pairs are independent of each other and the differences are approximately normally distributed. Rows missing one member of the pair are skipped.",
      "জোড়াগুলো পরস্পর স্বাধীন এবং পার্থক্যগুলো প্রায় স্বাভাবিক বিন্যাসভুক্ত। জোড়ার একটি মান না থাকলে সেই সারি বাদ যায়।",
    ),
    formulaSummary: [
      "d\u0304 = mean of within-pair differences",
      "t = d\u0304 / (s_d / \u221an)",
      "df = n \u2212 1",
    ],
    legend: t(
      "d\u0304 = mean difference; s_d = standard deviation of the differences; n = number of complete pairs.",
      "d\u0304 = গড় পার্থক্য; s_d = পার্থক্যগুলোর আদর্শ বিচ্যুতি; n = পূর্ণ জোড়ার সংখ্যা।",
    ),
    fields: [ALPHA_FIELD, TAILS_FIELD],
    tables: [
      twoColumnTable(
        "Matched pairs",
        "মিলিত জোড়া",
        "Before / A",
        "আগে / A",
        "After / B",
        "পরে / B",
      ),
    ],
    example: {
      fields: { alpha: "0.05", tails: "two-sided" },
      tables: {
        data: [
          ["72", "75"],
          ["68", "70"],
          ["80", "82"],
          ["75", "78"],
          ["70", "69"],
          ["74", "77"],
          ["69", "71"],
          ["77", "79"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const tails = getTails(input);
      const pairs = pairedColumns(
        input,
        "data",
        0,
        1,
        t("Matched pairs", "মিলিত জোড়া"),
        t("Before / A", "আগে / A"),
        t("After / B", "পরে / B"),
      );
      if (pairs.a.length < 2) {
        throw new CalcInputError(
          t("Enter at least two complete pairs.", "অন্তত দুটি পূর্ণ জোড়া লিখুন।"),
        );
      }
      const result = pairedT(pairs.a, pairs.b, alpha, tails);
      const info = decision(result.pValue, alpha);
      const critical = studentTQuantile(
        1 - alpha / (tails === "two-sided" ? 2 : 1),
        result.df,
      );

      return {
        metrics: [
          { label: t("Pairs used", "ব্যবহৃত জোড়া"), value: String(result.n) },
          { label: t("Mean difference", "গড় পার্থক্য"), value: formatNumber(result.meanDifference, 4) },
          { label: t("SD of differences", "পার্থক্যের আদর্শ বিচ্যুতি"), value: formatNumber(result.sdDifference, 4) },
          { label: t("t statistic", "t পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: String(result.df) },
          pMetric(result.pValue),
          {
            label: t("Critical value", "সংকট মান"),
            value: `${tails === "two-sided" ? "\u00b1" : ""}${formatNumber(critical, 4)}`,
          },
          ciMetric(result.confidenceInterval),
          {
            label: t("Effect size (dz)", "প্রভাবের আকার (dz)"),
            value: result.effectSize === null ? "\u2014" : formatNumber(result.effectSize, 3),
          },
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              tails === "two-sided"
                ? "H\u2080: \u03bc_d = 0 ; H\u2081: \u03bc_d \u2260 0"
                : tails === "greater"
                  ? "H\u2080: \u03bc_d \u2264 0 ; H\u2081: \u03bc_d > 0"
                  : "H\u2080: \u03bc_d \u2265 0 ; H\u2081: \u03bc_d < 0",
            note: t(
              "\u03bc_d is the population mean of the paired differences.",
              "\u03bc_d হলো জোড়াভিত্তিক পার্থক্যের জনসংখ্যা গড়।",
            ),
          },
          {
            title: t("Difference and standard error", "পার্থক্য ও আদর্শ ত্রুটি"),
            formula: "d\u0304 = \u03a3d / n ; SE = s_d / \u221an",
            substitution: `d\u0304 = ${formatNumber(result.meanDifference, 3)}; SE = ${formatNumber(result.standardError, 3)}`,
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "t = d\u0304 / SE",
            substitution: `t = ${formatNumber(result.meanDifference, 3)} / ${formatNumber(result.standardError, 3)} = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The average within-pair change is ${formatNumber(result.meanDifference, 3)}. ${conclusion(info).en}`,
          `জোড়ার ভেতরের গড় পরিবর্তন ${formatNumber(result.meanDifference, 3)}। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings:
          pairs.skipped > 0
            ? [
                t(
                  `${pairs.skipped} row${pairs.skipped === 1 ? "" : "s"} had only one value and were skipped.`,
                  `${pairs.skipped}টি সারিতে একটিমাত্র মান ছিল, সেগুলো বাদ দেওয়া হয়েছে।`,
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "z-test-proportions",
    category: "hypothesis",
    title: t("Two-proportion Z-test", "দুই-অনুপাত Z-পরীক্ষা"),
    description: t(
      "Test whether two population proportions are equal using success counts.",
      "সফলতার গণনা ব্যবহার করে দুটি জনসংখ্যা অনুপাত সমান কিনা পরীক্ষা করুন।",
    ),
    whenToUse: t(
      "Use for a binary outcome measured in two independent groups, such as conversion rates or approval rates.",
      "দুটি স্বাধীন গ্রুপে দ্বি-মান ফলাফলের জন্য ব্যবহার করুন, যেমন কনভার্শন হার বা অনুমোদনের হার।",
    ),
    assumptions: t(
      "Independent observations within and between groups, and at least about 5 successes and 5 failures in each group.",
      "গ্রুপের ভেতরে ও গ্রুপগুলোর মধ্যে পর্যবেক্ষণ স্বাধীন, এবং প্রতিটি গ্রুপে অন্তত প্রায় ৫টি সফলতা ও ৫টি ব্যর্থতা থাকা উচিত।",
    ),
    formulaSummary: [
      "p\u0302 = (x\u2081 + x\u2082) / (n\u2081 + n\u2082)",
      "z = (p\u0302\u2081 \u2212 p\u0302\u2082) / \u221a[p\u0302(1 \u2212 p\u0302)(1/n\u2081 + 1/n\u2082)]",
    ],
    legend: t(
      "x = number of successes; n = group size; p\u0302 = pooled proportion.",
      "x = সফলতার সংখ্যা; n = গ্রুপের আকার; p\u0302 = pooled অনুপাত।",
    ),
    fields: [
      { key: "x1", label: t("Successes, group 1 (x\u2081)", "সফলতা, গ্রুপ ১ (x\u2081)"), defaultValue: "45", kind: "number" },
      { key: "n1", label: t("Sample size, group 1 (n\u2081)", "নমুনার আকার, গ্রুপ ১ (n\u2081)"), defaultValue: "100", kind: "number" },
      { key: "x2", label: t("Successes, group 2 (x\u2082)", "সফলতা, গ্রুপ ২ (x\u2082)"), defaultValue: "35", kind: "number" },
      { key: "n2", label: t("Sample size, group 2 (n\u2082)", "নমুনার আকার, গ্রুপ ২ (n\u2082)"), defaultValue: "100", kind: "number" },
      ALPHA_FIELD,
      TAILS_FIELD,
    ],
    tables: [],
    example: {
      fields: { x1: "45", n1: "100", x2: "35", n2: "100", alpha: "0.05", tails: "two-sided" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const tails = getTails(input);
      const x1 = numberField(input, "x1", t("Successes in group 1", "গ্রুপ ১-এর সফলতা"));
      const n1 = numberField(input, "n1", t("Sample size of group 1", "গ্রুপ ১-এর নমুনা আকার"));
      const x2 = numberField(input, "x2", t("Successes in group 2", "গ্রুপ ২-এর সফলতা"));
      const n2 = numberField(input, "n2", t("Sample size of group 2", "গ্রুপ ২-এর নমুনা আকার"));
      if (n1 <= 0 || n2 <= 0) {
        throw new CalcInputError(t("Sample sizes must be positive.", "নমুনার আকার ধনাত্মক হতে হবে।"));
      }
      if (x1 < 0 || x1 > n1 || x2 < 0 || x2 > n2) {
        throw new CalcInputError(
          t("Successes must be between zero and the sample size.", "সফলতার সংখ্যা শূন্য ও নমুনা আকারের মধ্যে হতে হবে।"),
        );
      }
      const result = twoProportionZ(x1, n1, x2, n2, alpha, tails);
      const info = decision(result.pValue, alpha);
      const critical = zCritical(alpha, tails === "two-sided" ? 2 : 1);
      const warnings = [] as { en: string; bn: string }[];
      if (
        x1 < 5 ||
        n1 - x1 < 5 ||
        x2 < 5 ||
        n2 - x2 < 5
      ) {
        warnings.push(
          t(
            "At least one group has fewer than 5 successes or failures. The normal approximation may be unreliable.",
            "অন্তত একটি গ্রুপে ৫টির কম সফলতা বা ব্যর্থতা আছে। স্বাভাবিক অনুমান অনির্ভরযোগ্য হতে পারে।",
          ),
        );
      }

      return {
        metrics: [
          { label: t("Proportion 1 (p\u0302\u2081)", "অনুপাত ১ (p\u0302\u2081)"), value: formatNumber(result.p1, 4) },
          { label: t("Proportion 2 (p\u0302\u2082)", "অনুপাত ২ (p\u0302\u2082)"), value: formatNumber(result.p2, 4) },
          { label: t("Difference", "পার্থক্য"), value: formatNumber(result.difference, 4) },
          { label: t("Pooled proportion", "pooled অনুপাত"), value: formatNumber(result.pooledProportion, 4) },
          { label: t("Z statistic", "Z পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          pMetric(result.pValue),
          {
            label: t("Critical value", "সংকট মান"),
            value: `${tails === "two-sided" ? "\u00b1" : ""}${formatNumber(critical, 4)}`,
          },
          ciMetric(result.confidenceInterval),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              tails === "two-sided"
                ? "H\u2080: p\u2081 = p\u2082 ; H\u2081: p\u2081 \u2260 p\u2082"
                : tails === "greater"
                  ? "H\u2080: p\u2081 \u2264 p\u2082 ; H\u2081: p\u2081 > p\u2082"
                  : "H\u2080: p\u2081 \u2265 p\u2082 ; H\u2081: p\u2081 < p\u2082",
          },
          {
            title: t("Sample proportions", "নমুনার অনুপাত"),
            formula: "p\u0302\u2081 = x\u2081/n\u2081 ; p\u0302\u2082 = x\u2082/n\u2082",
            substitution: `p\u0302\u2081 = ${x1}/${n1} = ${formatNumber(result.p1, 3)} ; p\u0302\u2082 = ${x2}/${n2} = ${formatNumber(result.p2, 3)}`,
          },
          {
            title: t("Pooled standard error", "pooled আদর্শ ত্রুটি"),
            formula: "SE = \u221a[p\u0302(1 \u2212 p\u0302)(1/n\u2081 + 1/n\u2082)]",
            substitution: `SE = ${formatNumber(result.standardError, 4)}`,
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "z = (p\u0302\u2081 \u2212 p\u0302\u2082) / SE",
            substitution: `z = ${formatNumber(result.difference, 3)} / ${formatNumber(result.standardError, 3)} = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The observed proportions are ${formatNumber(result.p1 * 100, 1)}% and ${formatNumber(result.p2 * 100, 1)}%. ${conclusion(info).en}`,
          `পর্যবেক্ষিত অনুপাত ${formatNumber(result.p1 * 100, 1)}% এবং ${formatNumber(result.p2 * 100, 1)}%। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings,
      };
    },
  },
  {
    id: "f-test-variance",
    category: "hypothesis",
    title: t("F-test for two variances", "দুই ভ্যারিয়েন্সের F-পরীক্ষা"),
    description: t(
      "Test whether two independent samples come from populations with equal variances.",
      "দুটি স্বাধীন নমুনা সমান ভ্যারিয়েন্সের জনসংখ্যা থেকে এসেছে কিনা পরীক্ষা করুন।",
    ),
    whenToUse: t(
      "Use before choosing between a pooled and Welch t-test, or whenever the spread itself is the question.",
      "pooled ও Welch t-পরীক্ষার মধ্যে বাছাই করার আগে, অথবা বিস্তারই যখন মূল প্রশ্ন, তখন ব্যবহার করুন।",
    ),
    assumptions: t(
      "Independent random samples from approximately normal populations. The F-test is very sensitive to non-normality, so interpret it cautiously.",
      "প্রায় স্বাভাবিক জনসংখ্যা থেকে স্বাধীন এলোমেলো নমুনা। F-পরীক্ষা অ-স্বাভাবিকতার প্রতি খুব সংবেদনশীল, তাই সতর্কভাবে ব্যাখ্যা করুন।",
    ),
    formulaSummary: [
      "F = s\u2081\u00b2 / s\u2082\u00b2",
      "df\u2081 = n\u2081 \u2212 1 ; df\u2082 = n\u2082 \u2212 1",
      "95% CI for \u03c3\u2081\u00b2/\u03c3\u2082\u00b2 = (F / F_{0.975,df\u2081,df\u2082}, F / F_{0.025,df\u2081,df\u2082})",
    ],
    legend: t(
      "s\u00b2 = sample variance; n = sample size; F-quantiles use the F distribution with the shown degrees of freedom.",
      "s\u00b2 = নমুনার ভ্যারিয়েন্স; n = নমুনার আকার; F-কোয়ান্টাইল নির্দেশিত স্বাধীনতার মাত্রাসহ F বিন্যাস ব্যবহার করে।",
    ),
    fields: [ALPHA_FIELD, TAILS_FIELD],
    tables: [
      twoColumnTable(
        "Sample observations",
        "নমুনার পর্যবেক্ষণ",
        "Sample A",
        "নমুনা A",
        "Sample B",
        "নমুনা B",
      ),
    ],
    example: {
      fields: { alpha: "0.05", tails: "two-sided" },
      tables: {
        data: [
          ["12", "10"],
          ["15", "13"],
          ["18", "11"],
          ["14", "12"],
          ["16", "14"],
          ["17", "13"],
          ["13", "15"],
          ["15", "12"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const tails = getTails(input);
      const first = numericColumn(
        input,
        "data",
        0,
        t("Sample observations", "নমুনার পর্যবেক্ষণ"),
        t("Sample A", "নমুনা A"),
      );
      const second = numericColumn(
        input,
        "data",
        1,
        t("Sample observations", "নমুনার পর্যবেক্ষণ"),
        t("Sample B", "নমুনা B"),
      );
      if (first.length < 2 || second.length < 2) {
        throw new CalcInputError(
          t("Each sample needs at least two observations.", "প্রতিটি নমুনায় অন্তত দুটি পর্যবেক্ষণ দরকার।"),
        );
      }
      const result = varianceFTest(first, second, alpha, tails);
      const info = decision(result.pValue, alpha);
      const critical =
        tails === "less"
          ? 1 / fCritical(alpha, result.df2, result.df1)
          : fCritical(alpha, result.df1, result.df2);

      return {
        metrics: [
          { label: t("Variance A (s\u2081\u00b2)", "ভ্যারিয়েন্স A (s\u2081\u00b2)"), value: formatNumber(result.variance1, 4) },
          { label: t("Variance B (s\u2082\u00b2)", "ভ্যারিয়েন্স B (s\u2082\u00b2)"), value: formatNumber(result.variance2, 4) },
          { label: t("F statistic", "F পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("df\u2081, df\u2082", "df\u2081, df\u2082"), value: `${result.df1}, ${result.df2}` },
          pMetric(result.pValue),
          { label: t("Critical value", "সংকট মান"), value: formatNumber(critical, 4) },
          ciMetric(result.confidenceInterval),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              tails === "two-sided"
                ? "H\u2080: \u03c3\u2081\u00b2 = \u03c3\u2082\u00b2 ; H\u2081: \u03c3\u2081\u00b2 \u2260 \u03c3\u2082\u00b2"
                : tails === "greater"
                  ? "H\u2080: \u03c3\u2081\u00b2 \u2264 \u03c3\u2082\u00b2 ; H\u2081: \u03c3\u2081\u00b2 > \u03c3\u2082\u00b2"
                  : "H\u2080: \u03c3\u2081\u00b2 \u2265 \u03c3\u2082\u00b2 ; H\u2081: \u03c3\u2081\u00b2 < \u03c3\u2082\u00b2",
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "F = s\u2081\u00b2 / s\u2082\u00b2",
            substitution: `F = ${formatNumber(result.variance1, 3)} / ${formatNumber(result.variance2, 3)} = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("Degrees of freedom", "স্বাধীনতার মাত্রা"),
            formula: "df\u2081 = n\u2081 \u2212 1 ; df\u2082 = n\u2082 \u2212 1",
            substitution: `df\u2081 = ${result.df1}; df\u2082 = ${result.df2}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The variance ratio is ${formatNumber(result.statistic, 3)}. ${conclusion(info).en} Remember that the F-test is not a test of equal means.`,
          `ভ্যারিয়েন্স অনুপাত ${formatNumber(result.statistic, 3)}। ${conclusion(info).bn} মনে রাখবেন, F-পরীক্ষা সমান গড়ের পরীক্ষা নয়।`,
        ),
        decision: info,
        warnings: [
          t(
            "The F-test assumes normal populations and is sensitive to outliers. A visual check of both samples is strongly recommended.",
            "F-পরীক্ষা স্বাভাবিক জনসংখ্যা ধরে এবং চরম মানের প্রতি সংবেদনশীল। দুই নমুনার ভিজ্যুয়াল যাচাই খুবই সুপারিশ করা হয়।",
          ),
        ],
      };
    },
  },
  {
    id: "chi-square-gof",
    category: "hypothesis",
    title: t("Chi-square goodness-of-fit", "কাই-স্কয়ার সদৃশ্য পরীক্ষা"),
    description: t(
      "Test whether observed category counts match an expected distribution.",
      "পর্যবেক্ষিত শ্রেণির গণনা প্রত্যাশিত বিন্যাসের সঙ্গে মেলে কিনা পরীক্ষা করুন।",
    ),
    whenToUse: t(
      "Use with one categorical variable, such as whether customer preferences match an assumed split.",
      "একটি শ্রেণিগত চলকের জন্য ব্যবহার করুন, যেমন গ্রাহকের পছন্দ অনুমিত অনুপাতের সঙ্গে মেলে কিনা।",
    ),
    assumptions: t(
      "Independent observations, mutually exclusive categories, and expected counts of at least 5 in each category (or combine sparse categories).",
      "স্বাধীন পর্যবেক্ষণ, পরস্পর-বহির্ভূত শ্রেণি এবং প্রতিটি শ্রেণিতে অন্তত ৫টি প্রত্যাশিত গণনা (অথবা কম গণনার শ্রেণি একত্র করুন)।",
    ),
    formulaSummary: [
      "\u03c7\u00b2 = \u03a3[(O \u2212 E)\u00b2 / E]",
      "df = k \u2212 1",
      "Expected = total / k when expected counts are equal",
    ],
    legend: t(
      "O = observed count; E = expected count; k = number of categories.",
      "O = পর্যবেক্ষিত গণনা; E = প্রত্যাশিত গণনা; k = শ্রেণির সংখ্যা।",
    ),
    fields: [ALPHA_FIELD],
    tables: [
      {
        key: "data",
        label: t("Category counts", "শ্রেণির গণনা"),
        description: t(
          "Enter the label, observed count, and (optionally) an expected count. Leave the expected column blank for equal expected counts.",
          "লেবেল, পর্যবেক্ষিত গণনা এবং (ঐচ্ছিক) প্রত্যাশিত গণনা লিখুন। সমান প্রত্যাশার জন্য প্রত্যাশিত কলাম খালি রাখুন।",
        ),
        columns: [
          { key: "observed", label: t("Observed (O)", "পর্যবেক্ষিত (O)") },
          { key: "expected", label: t("Expected (E, optional)", "প্রত্যাশিত (E, ঐচ্ছিক)") },
        ],
        rowLabels: true,
        minRows: 2,
        maxRows: 100,
        initialRows: 5,
        addRowLabel: t("Add category", "শ্রেণি যোগ করুন"),
      },
    ],
    example: {
      fields: { alpha: "0.05" },
      tables: {
        data: [
          ["Very satisfied", "42", "40"],
          ["Satisfied", "35", "40"],
          ["Neutral", "18", "20"],
          ["Dissatisfied", "5", "10"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const table = input.tables.data;
      if (!table) {
        throw new CalcInputError(t("The category table is missing.", "শ্রেণির টেবিল পাওয়া যায়নি।"));
      }

      const labels: string[] = [];
      const observed: number[] = [];
      const expectedRaw: (number | null)[] = [];
      let anyExpected = false;

      table.rows.forEach((row, index) => {
        if (isBlank(row[1])) return;
        const observedValue = parseCell(row[1]);
        if (observedValue === null || Number.isNaN(observedValue)) {
          throw new CalcInputError(
            t(
              `Row ${index + 1}: observed count must be a number.`,
              `${index + 1} নম্বর সারি: পর্যবেক্ষিত গণনা সংখ্যা হতে হবে।`,
            ),
          );
        }
        if (observedValue < 0) {
          throw new CalcInputError(
            t(`Row ${index + 1}: counts cannot be negative.`, `${index + 1} নম্বর সারি: গণনা ঋণাত্মক হতে পারে না।`),
          );
        }
        const expectedValue = parseCell(row[2]);
        if (!isBlank(row[2]) && (expectedValue === null || Number.isNaN(expectedValue))) {
          throw new CalcInputError(
            t(
              `Row ${index + 1}: expected count must be a number or blank.`,
              `${index + 1} নম্বর সারি: প্রত্যাশিত গণনা সংখ্যা অথবা খালি হতে হবে।`,
            ),
          );
        }
        if (expectedValue !== null) anyExpected = true;
        labels.push(row[0]?.trim() || `Category ${labels.length + 1}`);
        observed.push(observedValue);
        expectedRaw.push(expectedValue);
      });

      if (observed.length < 2) {
        throw new CalcInputError(
          t("Enter at least two categories.", "অন্তত দুটি শ্রেণি লিখুন।"),
        );
      }

      let expected: number[] | null = null;
      if (anyExpected) {
        if (expectedRaw.some((value) => value === null)) {
          throw new CalcInputError(
            t(
              "Fill the expected count for every category, or leave the whole column blank.",
              "প্রতিটি শ্রেণির প্রত্যাশিত গণনা পূরণ করুন, অথবা পুরো কলাম খালি রাখুন।",
            ),
          );
        }
        expected = expectedRaw as number[];
        if (expected.some((value) => value <= 0)) {
          throw new CalcInputError(
            t("Expected counts must be positive.", "প্রত্যাশিত গণনা ধনাত্মক হতে হবে।"),
          );
        }
      }

      const result = chiSquareGoodnessOfFit(observed, expected, alpha);
      const info = decision(result.pValue, alpha);
      const warnings = [] as { en: string; bn: string }[];
      if (result.smallExpected > 0) {
        warnings.push(
          t(
            `${result.smallExpected} expected count${result.smallExpected === 1 ? " is" : "s are"} below 5. Combine sparse categories or interpret the p-value cautiously.`,
            `${result.smallExpected}টি প্রত্যাশিত গণনা ৫-এর কম। কম গণনার শ্রেণি একত্র করুন অথবা p-মান সতর্কভাবে ব্যাখ্যা করুন।`,
          ),
        );
      }

      return {
        metrics: [
          { label: t("Chi-square statistic", "কাই-স্কয়ার পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: String(result.df) },
          pMetric(result.pValue),
          { label: t("Critical value", "সংকট মান"), value: formatNumber(result.critical, 4) },
          decisionMetric(info),
        ],
        tables: [
          {
            title: t("Observed versus expected", "পর্যবেক্ষিত বনাম প্রত্যাশিত"),
            headers: ["Category", "Observed (O)", "Expected (E)", "(O\u2212E)\u00b2/E"],
            rows: result.cells.map((cell, index) => [
              labels[index],
              formatNumber(cell.observed, 2),
              formatNumber(cell.expected, 3),
              formatNumber(cell.contribution, 4),
            ]),
            align: ["left", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              "H\u2080: the observed distribution matches the expected distribution ; H\u2081: at least one category differs",
          },
          {
            title: t("Expected counts", "প্রত্যাশিত গণনা"),
            formula: expected === null ? "E = total / k" : "E = the expected count you supplied",
            substitution: `Total O = ${formatNumber(observed.reduce((a, b) => a + b, 0), 3)}`,
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "\u03c7\u00b2 = \u03a3[(O \u2212 E)\u00b2 / E]",
            substitution: `\u03c7\u00b2 = ${formatNumber(result.statistic, 3)} with df = ${result.df}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The observed counts ${info.rejected ? "differ significantly from" : "are consistent with"} the expected distribution. ${conclusion(info).en}`,
          `পর্যবেক্ষিত গণনা প্রত্যাশিত বিন্যাসের সঙ্গে ${info.rejected ? "উল্লেখযোগ্যভাবে ভিন্ন" : "সামঞ্জস্যপূর্ণ"}। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings,
      };
    },
  },
  {
    id: "chi-square-independence",
    category: "hypothesis",
    title: t("Chi-square test of independence", "স্বাধীনতার কাই-স্কয়ার পরীক্ষা"),
    description: t(
      "Test whether two categorical variables are associated using a contingency table.",
      "কন্টিনজেন্সি টেবিল ব্যবহার করে দুটি শ্রেণিগত চলকের সম্পর্ক আছে কিনা পরীক্ষা করুন।",
    ),
    whenToUse: t(
      "Use when each observation belongs to one row category and one column category, such as region and product choice.",
      "প্রতিটি পর্যবেক্ষণ একটি সারি শ্রেণি ও একটি কলাম শ্রেণিতে পড়লে ব্যবহার করুন, যেমন অঞ্চল ও পণ্যপছন্দ।",
    ),
    assumptions: t(
      "Independent observations, mutually exclusive categories, and mostly expected counts of at least 5. Yates' correction is available for 2\u00d72 tables.",
      "স্বাধীন পর্যবেক্ষণ, পরস্পর-বহির্ভূত শ্রেণি এবং বেশিরভাগ প্রত্যাশিত গণনা অন্তত ৫। 2\u00d72 টেবিলে ইয়েটস সংশোধন পাওয়া যায়।",
    ),
    formulaSummary: [
      "E\u1d62\u2c7c = (row total \u00d7 column total) / grand total",
      "\u03c7\u00b2 = \u03a3[(O \u2212 E)\u00b2 / E]",
      "df = (r \u2212 1)(c \u2212 1)",
      "Yates correction (2\u00d72): \u03c7\u00b2 = \u03a3[(|O \u2212 E| \u2212 0.5)\u00b2 / E]",
      "Cram\u00e9r's V = \u221a[\u03c7\u00b2 / (N \u00d7 min(r\u22121, c\u22121))]",
    ],
    legend: t(
      "O = cell count; E = expected cell count; r = rows; c = columns; N = grand total.",
      "O = ঘরের গণনা; E = প্রত্যাশিত ঘরের গণনা; r = সারি; c = কলাম; N = মোট।",
    ),
    fields: [
      ALPHA_FIELD,
      {
        key: "yates",
        label: t("Yates' correction (2\u00d72)", "ইয়েটস সংশোধন (2\u00d72)"),
        defaultValue: "no",
        kind: "select",
        options: YES_NO_OPTIONS,
      },
    ],
    tables: [
      {
        key: "data",
        label: t("Contingency table", "কন্টিনজেন্সি টেবিল"),
        description: t(
          "The first column holds row labels. The numeric columns are the categories. Add a column for more categories.",
          "প্রথম কলামে সারির লেবেল থাকে। সংখ্যাগত কলামগুলো শ্রেণি। আরও শ্রেণির জন্য কলাম যোগ করুন।",
        ),
        columns: [
          { key: "column-1", label: t("Column 1", "কলাম ১") },
          { key: "column-2", label: t("Column 2", "কলাম ২") },
        ],
        rowLabels: true,
        dynamicColumns: true,
        minRows: 2,
        maxRows: 50,
        initialRows: 3,
        initialColumns: 2,
        addRowLabel: t("Add row category", "সারি শ্রেণি যোগ করুন"),
        addColumnLabel: t("Add column category", "কলাম শ্রেণি যোগ করুন"),
      },
    ],
    example: {
      fields: { alpha: "0.05", yates: "no" },
      tables: {
        data: [
          ["Dhaka", "40", "25"],
          ["Chattogram", "30", "35"],
          ["Khulna", "20", "30"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const parsed = labelledMatrix(
        input,
        "data",
        t("Contingency table", "কন্টিনজেন্সি টেবিল"),
      );
      if (parsed.rowCount < 2) {
        throw new CalcInputError(
          t("Enter at least two rows.", "অন্তত দুটি সারি লিখুন।"),
        );
      }
      const yates = input.fields.yates === "yes";
      const result = chiSquareIndependence(parsed.matrix, alpha, yates);
      const info = decision(result.pValue, alpha);
      const warnings = [] as { en: string; bn: string }[];
      if (result.smallExpected > 0) {
        warnings.push(
          t(
            `${result.smallExpected} expected cell count${result.smallExpected === 1 ? " is" : "s are"} below 5. Combine categories or interpret the result cautiously.`,
            `${result.smallExpected}টি প্রত্যাশিত ঘরের গণনা ৫-এর কম। শ্রেণি একত্র করুন অথবা ফলাফল সতর্কভাবে ব্যাখ্যা করুন।`,
          ),
        );
      }

      return {
        metrics: [
          { label: t("Chi-square statistic", "কাই-স্কয়ার পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: String(result.df) },
          pMetric(result.pValue),
          { label: t("Critical value", "সংকট মান"), value: formatNumber(result.critical, 4) },
          { label: t("Cram\u00e9r's V", "ক্র্যামারস V"), value: formatNumber(result.cramersV, 3) },
          { label: t("Total observations", "মোট পর্যবেক্ষণ"), value: String(result.total) },
          decisionMetric(info),
        ],
        tables: [
          {
            title: t("Observed count (expected count)", "পর্যবেক্ষিত গণনা (প্রত্যাশিত গণনা)"),
            headers: ["", ...parsed.headers],
            rows: parsed.rowLabels.map((label, rowIndex) => [
              label,
              ...parsed.matrix[rowIndex].map(
                (value, columnIndex) =>
                  `${value} (${formatNumber(result.expected[rowIndex][columnIndex], 2)})`,
              ),
            ]),
            align: ["left", ...parsed.headers.map(() => "right" as const)],
          },
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              "H\u2080: the two variables are independent ; H\u2081: they are associated",
          },
          {
            title: t("Expected counts", "প্রত্যাশিত গণনা"),
            formula: "E\u1d62\u2c7c = (row total \u00d7 column total) / N",
            substitution: `N = ${result.total}`,
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: yates
              ? "\u03c7\u00b2 = \u03a3[(|O \u2212 E| \u2212 0.5)\u00b2 / E] (Yates)"
              : "\u03c7\u00b2 = \u03a3[(O \u2212 E)\u00b2 / E]",
            substitution: `\u03c7\u00b2 = ${formatNumber(result.statistic, 3)} with df = (${parsed.rowCount}\u22121)(${parsed.columnCount}\u22121) = ${result.df}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `Cram\u00e9r's V is ${formatNumber(result.cramersV, 3)}, where 0 means no association and 1 means a perfect association. ${conclusion(info).en}`,
          `ক্র্যামারস V ${formatNumber(result.cramersV, 3)}, যেখানে ০ মানে কোনো সম্পর্ক নেই এবং ১ মানে পূর্ণ সম্পর্ক। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings,
      };
    },
  },
  {
    id: "anova-one-way",
    category: "hypothesis",
    title: t("One-way ANOVA", "একমুখী ANOVA"),
    description: t(
      "Compare the means of three or more independent groups in one test.",
      "একটি পরীক্ষায় তিন বা তার বেশি স্বাধীন গ্রুপের গড় তুলনা করুন।",
    ),
    whenToUse: t(
      "Use instead of repeated pairwise t-tests when you have several groups and one factor.",
      "একাধিক গ্রুপ ও একটি কারণ থাকলে বারবার জোড়াভিত্তিক t-পরীক্ষার বদলে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Independent groups, approximately normal observations within each group, and roughly equal variances. Unequal group sizes are allowed.",
      "স্বাধীন গ্রুপ, প্রতিটি গ্রুপে প্রায় স্বাভাবিক পর্যবেক্ষণ এবং মোটামুটি সমান ভ্যারিয়েন্স। গ্রুপের আকার ভিন্ন হতে পারে।",
    ),
    formulaSummary: [
      "SSB = \u03a3 n\u1d62(x\u0304\u1d62 \u2212 x\u0304)\u00b2",
      "SSW = \u03a3\u03a3(x \u2212 x\u0304\u1d62)\u00b2",
      "F = (SSB/(k\u22121)) / (SSW/(N\u2212k))",
      "\u03b7\u00b2 = SSB / SST",
    ],
    legend: t(
      "SSB = between-group sum of squares; SSW = within-group sum of squares; k = number of groups; N = total observations; \u03b7\u00b2 = share of variation explained by group membership.",
      "SSB = গ্রুপের মধ্যে সমষ্টি বর্গ; SSW = গ্রুপের ভেতরের সমষ্টি বর্গ; k = গ্রুপ সংখ্যা; N = মোট পর্যবেক্ষণ; \u03b7\u00b2 = গ্রুপ দ্বারা ব্যাখ্যা করা ভিন্নতার অংশ।",
    ),
    fields: [ALPHA_FIELD],
    tables: [
      {
        key: "data",
        label: t("Group observations", "গ্রুপের পর্যবেক্ষণ"),
        description: t(
          "Each column is one group. Columns may have different numbers of values; blanks are skipped.",
          "প্রতিটি কলাম একটি গ্রুপ। কলামে ভিন্ন সংখ্যক মান থাকতে পারে; খালি ঘর বাদ যায়।",
        ),
        columns: [
          { key: "group-1", label: t("Group 1", "গ্রুপ ১") },
          { key: "group-2", label: t("Group 2", "গ্রুপ ২") },
        ],
        dynamicColumns: true,
        minRows: 2,
        maxRows: 500,
        initialRows: 8,
        initialColumns: 2,
        addRowLabel: t("Add row", "সারি যোগ করুন"),
        addColumnLabel: t("Add group", "গ্রুপ যোগ করুন"),
      },
    ],
    example: {
      fields: { alpha: "0.05" },
      tables: {
        data: [
          ["12", "15", "18"],
          ["14", "16", "17"],
          ["13", "18", "19"],
          ["15", "17", "20"],
          ["16", "19", "18"],
          ["14", "16", "21"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const table = input.tables.data;
      if (!table) {
        throw new CalcInputError(t("The group table is missing.", "গ্রুপের টেবিল পাওয়া যায়নি।"));
      }
      const groups: number[][] = [];
      const names: string[] = [];

      table.headers.forEach((header, index) => {
        if (!table.rows.some((row) => !isBlank(row[index]))) return;
        const values = numericColumn(
          input,
          "data",
          index,
          t("Group observations", "গ্রুপের পর্যবেক্ষণ"),
          t(header || `Group ${index + 1}`, header || `গ্রুপ ${index + 1}`),
        );
        if (values.length < 2) {
          throw new CalcInputError(
            t(
              `${header || `Group ${index + 1}`} needs at least two observations.`,
              `${header || `গ্রুপ ${index + 1}`}-এ অন্তত দুটি পর্যবেক্ষণ দরকার।`,
            ),
          );
        }
        groups.push(values);
        names.push(header || `Group ${index + 1}`);
      });

      if (groups.length < 2) {
        throw new CalcInputError(
          t("ANOVA needs at least two groups.", "ANOVA-র জন্য অন্তত দুটি গ্রুপ দরকার।"),
        );
      }

      const result = oneWayAnova(groups, alpha);
      const info = decision(result.pValue, alpha);
      const warnings = [] as { en: string; bn: string }[];
      if (new Set(groups.map((group) => group.length)).size > 1) {
        warnings.push(
          t(
            "Group sizes differ. The F-test still works, but interpretation is more robust when groups are similar in size.",
            "গ্রুপের আকার ভিন্ন। F-পরীক্ষা কাজ করে, তবে গ্রুপের আকার কাছাকাছি হলে ব্যাখ্যা বেশি নির্ভরযোগ্য।",
          ),
        );
      }

      return {
        metrics: [
          { label: t("Groups (k)", "গ্রুপ (k)"), value: String(groups.length) },
          { label: t("Observations (N)", "পর্যবেক্ষণ (N)"), value: String(groups.flat().length) },
          { label: t("F statistic", "F পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("df between, within", "df মধ্যে, ভেতরে"), value: `${result.dfBetween}, ${result.dfWithin}` },
          pMetric(result.pValue),
          { label: t("Critical value", "সংকট মান"), value: formatNumber(result.critical, 4) },
          { label: t("\u03b7\u00b2 (effect size)", "\u03b7\u00b2 (প্রভাবের আকার)"), value: formatNumber(result.etaSquared, 3) },
          decisionMetric(info),
        ],
        tables: [
          {
            title: t("Group summary", "গ্রুপ সারসংক্ষেপ"),
            headers: ["Group", "n", "Mean", "SD"],
            rows: result.groups.map((group, index) => [
              names[index],
              String(group.n),
              formatNumber(group.mean, 3),
              formatNumber(group.standardDeviation, 3),
            ]),
            align: ["left", "right", "right", "right"],
          },
          {
            title: t("ANOVA table", "ANOVA টেবিল"),
            headers: ["Source", "SS", "df", "MS", "F", "p"],
            rows: [
              [
                "Between groups",
                formatNumber(result.ssBetween, 3),
                String(result.dfBetween),
                formatNumber(result.msBetween, 3),
                formatNumber(result.statistic, 3),
                formatNumber(result.pValue, 4),
              ],
              [
                "Within groups",
                formatNumber(result.ssWithin, 3),
                String(result.dfWithin),
                formatNumber(result.msWithin, 3),
                "",
                "",
              ],
              [
                "Total",
                formatNumber(result.ssTotal, 3),
                String(result.dfBetween + result.dfWithin),
                "",
                "",
                "",
              ],
            ],
            align: ["left", "right", "right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula:
              "H\u2080: \u03bc\u2081 = \u03bc\u2082 = \u2026 = \u03bc\u2096 ; H\u2081: at least one mean differs",
          },
          {
            title: t("Sum of squares", "সমষ্টি বর্গ"),
            formula: "SSB = \u03a3 n\u1d62(x\u0304\u1d62 \u2212 x\u0304)\u00b2 ; SSW = \u03a3\u03a3(x \u2212 x\u0304\u1d62)\u00b2",
            substitution: `SSB = ${formatNumber(result.ssBetween, 3)} ; SSW = ${formatNumber(result.ssWithin, 3)}`,
          },
          {
            title: t("Mean squares and F", "গড় বর্গ ও F"),
            formula: "F = (SSB/(k\u22121)) / (SSW/(N\u2212k))",
            substitution: `F = (${formatNumber(result.ssBetween, 3)}/${result.dfBetween}) / (${formatNumber(result.ssWithin, 3)}/${result.dfWithin}) = ${formatNumber(result.statistic, 3)}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `Group membership explains about ${formatNumber(result.etaSquared * 100, 1)}% of the total variation in the outcome. ${conclusion(info).en}`,
          `গ্রুপ সদস্যতা ফলাফলের মোট ভিন্নতার প্রায় ${formatNumber(result.etaSquared * 100, 1)}% ব্যাখ্যা করে। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings,
      };
    },
  },
];
