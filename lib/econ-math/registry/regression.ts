import {
  formatNumber,
  numberField,
  pairedColumns,
} from "@/lib/econ-math/io";
import { pearson, simpleOls, spearman } from "@/lib/econ-math/regression";
import {
  ALPHA_FIELD,
  ciMetric,
  conclusion,
  decision,
  decisionMetric,
  pMetric,
} from "@/lib/econ-math/shared";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorInput,
  type CalculatorResult,
} from "@/lib/econ-math/types";

const XY_TABLE = {
  key: "data",
  label: t("Paired observations", "জোড়াভিত্তিক পর্যবেক্ষণ"),
  description: t(
    "Each row is one matched pair. Rows with a blank cell are skipped.",
    "প্রতিটি সারি একটি মিলিত জোড়া। খালি ঘরযুক্ত সারি বাদ যায়।",
  ),
  columns: [
    { key: "x", label: t("X (independent)", "X (স্বাধীন)") },
    { key: "y", label: t("Y (dependent)", "Y (নির্ভরশীল)") },
  ],
  minRows: 3,
  maxRows: 500,
  initialRows: 8,
  addRowLabel: t("Add pair", "জোড়া যোগ করুন"),
};

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

export const regressionCalculators: CalculatorDef[] = [
  {
    id: "pearson-correlation",
    category: "regression",
    title: t("Pearson correlation", "পিয়ারসন সম্পর্ক"),
    description: t(
      "Measure the strength and direction of a linear relationship between two variables.",
      "দুটি চলকের মধ্যে রৈখিক সম্পর্কের শক্তি ও দিক মাপুন।",
    ),
    whenToUse: t(
      "Use when both variables are quantitative and the relationship looks roughly linear. It describes association, not causation.",
      "দুটি চলকই পরিমাণগত এবং সম্পর্ক মোটামুটি রৈখিক হলে ব্যবহার করুন। এটি সহসম্পর্ক বোঝায়, কারণ নয়।",
    ),
    assumptions: t(
      "Numeric pairs, independent observations, and an approximately linear relationship. Pearson's r is sensitive to outliers.",
      "সংখ্যাগত জোড়া, স্বাধীন পর্যবেক্ষণ এবং প্রায় রৈখিক সম্পর্ক। পিয়ারসনের r চরম মানের প্রতি সংবেদনশীল।",
    ),
    formulaSummary: [
      "r = Sxy / \u221a(Sxx \u00d7 Syy)",
      "Sxy = \u03a3(x \u2212 x\u0304)(y \u2212 y\u0304)",
      "t = r\u221a[(n \u2212 2)/(1 \u2212 r\u00b2)] with df = n \u2212 2",
      "Fisher 95% CI: tanh(atanh(r) \u00b1 1.96/\u221a(n\u22123))",
    ],
    legend: t(
      "r ranges from \u22121 to 1. Values near 0 mean little linear association; values near \u00b11 mean a strong linear association.",
      "r-এর মান \u22121 থেকে 1 পর্যন্ত। 0-এর কাছাকাছি মানে দুর্বল রৈখিক সম্পর্ক; \u00b11-এর কাছাকাছি মানে শক্তিশালী রৈখিক সম্পর্ক।",
    ),
    fields: [ALPHA_FIELD],
    tables: [XY_TABLE],
    example: {
      fields: { alpha: "0.05" },
      tables: {
        data: [
          ["10", "22"],
          ["12", "25"],
          ["15", "28"],
          ["18", "32"],
          ["20", "35"],
          ["22", "38"],
          ["25", "42"],
          ["28", "45"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const pairs = pairedColumns(
        input,
        "data",
        0,
        1,
        t("Paired observations", "জোড়াভিত্তিক পর্যবেক্ষণ"),
        t("X", "X"),
        t("Y", "Y"),
      );
      if (pairs.a.length < 3) {
        throw new CalcInputError(
          t("Enter at least three complete pairs.", "অন্তত তিনটি পূর্ণ জোড়া লিখুন।"),
        );
      }
      const result = pearson(pairs.a, pairs.b);
      const info = decision(result.pValue, alpha);

      return {
        metrics: [
          { label: t("Pairs (n)", "জোড়া (n)"), value: String(result.n) },
          { label: t("Correlation (r)", "সম্পর্ক (r)"), value: formatNumber(result.r, 4) },
          { label: t("R\u00b2", "R\u00b2"), value: formatNumber(result.rSquared, 4) },
          { label: t("t statistic", "t পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: String(result.df) },
          pMetric(result.pValue),
          ciMetric(result.confidenceInterval),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula: "H\u2080: \u03c1 = 0 ; H\u2081: \u03c1 \u2260 0",
            note: t(
              "\u03c1 is the population correlation coefficient.",
              "\u03c1 হলো জনসংখ্যার সম্পর্ক সহগ।",
            ),
          },
          {
            title: t("Correlation coefficient", "সম্পর্ক সহগ"),
            formula: "r = Sxy / \u221a(Sxx \u00d7 Syy)",
            substitution: `r = ${formatNumber(result.r, 4)}`,
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "t = r\u221a[(n \u2212 2)/(1 \u2212 r\u00b2)]",
            substitution: `t = ${formatNumber(result.statistic, 3)} with df = ${result.df}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The sample correlation is ${formatNumber(result.r, 3)}, so the variables have a ${Math.abs(result.r) < 0.3 ? "weak" : Math.abs(result.r) < 0.7 ? "moderate" : "strong"} ${result.r >= 0 ? "positive" : "negative"} linear association. ${conclusion(info).en}`,
          `নমুনার সম্পর্ক ${formatNumber(result.r, 3)}, ফলে চলকগুলোর মধ্যে ${Math.abs(result.r) < 0.3 ? "দুর্বল" : Math.abs(result.r) < 0.7 ? "মাঝারি" : "শক্তিশালী"} ${result.r >= 0 ? "ধনাত্মক" : "ঋণাত্মক"} রৈখিক সম্পর্ক আছে। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings:
          pairs.skipped > 0
            ? [
                t(
                  `${pairs.skipped} incomplete row${pairs.skipped === 1 ? " was" : "s were"} skipped.`,
                  `${pairs.skipped}টি অসম্পূর্ণ সারি বাদ দেওয়া হয়েছে।`,
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "spearman-correlation",
    category: "regression",
    title: t("Spearman rank correlation", "স্পিয়ারম্যান র‍্যাঙ্ক সম্পর্ক"),
    description: t(
      "Measure a monotonic relationship using ranks, so it is less sensitive to outliers and non-linearity.",
      "র‍্যাঙ্ক ব্যবহার করে একদিকমুখী সম্পর্ক মাপুন, ফলে চরম মান ও অরৈখিকতায় কম সংবেদনশীল।",
    ),
    whenToUse: t(
      "Use for ordinal data, skewed data, or when the relationship is consistently increasing or decreasing but not necessarily linear.",
      "ক্রমবাচক ডেটা, বাঁকা বিন্যাস, অথবা সম্পর্ক ধারাবাহিকভাবে বাড়ছে বা কমছে কিন্তু রৈখিক নয়—এমন ক্ষেত্রে ব্যবহার করুন।",
    ),
    assumptions: t(
      "At least three complete pairs. Ties receive average ranks. The p-value uses the same t approximation as Pearson on the ranks.",
      "অন্তত তিনটি পূর্ণ জোড়া। সমান মানগুলো গড় র‍্যাঙ্ক পায়। p-মান র‍্যাঙ্কের ওপর পিয়ারসনের মতো t অনুমান ব্যবহার করে।",
    ),
    formulaSummary: [
      "r_s = Pearson correlation of the ranks",
      "t = r_s\u221a[(n \u2212 2)/(1 \u2212 r_s\u00b2)] with df = n \u2212 2",
    ],
    legend: t(
      "r_s ranges from \u22121 to 1 and measures how consistently Y rises or falls as X rises.",
      "r_s-এর মান \u22121 থেকে 1 এবং X বাড়ার সঙ্গে Y কতটা ধারাবাহিকভাবে বাড়ে বা কমে তা মাপে।",
    ),
    fields: [ALPHA_FIELD],
    tables: [XY_TABLE],
    example: {
      fields: { alpha: "0.05" },
      tables: {
        data: [
          ["1", "5"],
          ["2", "6"],
          ["3", "8"],
          ["4", "7"],
          ["5", "10"],
          ["6", "9"],
          ["7", "12"],
          ["8", "11"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const pairs = pairedColumns(
        input,
        "data",
        0,
        1,
        t("Paired observations", "জোড়াভিত্তিক পর্যবেক্ষণ"),
        t("X", "X"),
        t("Y", "Y"),
      );
      if (pairs.a.length < 3) {
        throw new CalcInputError(
          t("Enter at least three complete pairs.", "অন্তত তিনটি পূর্ণ জোড়া লিখুন।"),
        );
      }
      const result = spearman(pairs.a, pairs.b);
      const info = decision(result.pValue, alpha);

      return {
        metrics: [
          { label: t("Pairs (n)", "জোড়া (n)"), value: String(result.n) },
          { label: t("Spearman r_s", "স্পিয়ারম্যান r_s"), value: formatNumber(result.r, 4) },
          { label: t("t statistic", "t পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: String(result.df) },
          pMetric(result.pValue),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula: "H\u2080: \u03c1_s = 0 ; H\u2081: \u03c1_s \u2260 0",
          },
          {
            title: t("Rank transformation", "র‍্যাঙ্ক রূপান্তর"),
            formula: "Replace each value by its average rank, then compute Pearson's r on the ranks.",
            note: t(
              "Tied observations share the average of the ranks they would have received.",
              "সমান মানগুলো যে র‍্যাঙ্কগুলো পেত তার গড় ভাগ করে নেয়।",
            ),
          },
          {
            title: t("Test statistic", "পরীক্ষার পরিসংখ্যান"),
            formula: "r_s = Pearson correlation of ranks ; t = r_s\u221a[(n \u2212 2)/(1 \u2212 r_s\u00b2)]",
            substitution: `r_s = ${formatNumber(result.r, 4)}; t = ${formatNumber(result.statistic, 3)} with df = ${result.df}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Reject H\u2080 when p < \u03b1",
            substitution: `p = ${formatNumber(result.pValue, 4)}, \u03b1 = ${formatNumber(alpha, 3)}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `The rank correlation is ${formatNumber(result.r, 3)}, describing a ${result.r >= 0 ? "positive" : "negative"} monotonic association. ${conclusion(info).en}`,
          `র‍্যাঙ্ক সম্পর্ক ${formatNumber(result.r, 3)}, যা ${result.r >= 0 ? "ধনাত্মক" : "ঋণাত্মক"} একদিকমুখী সম্পর্ক বোঝায়। ${conclusion(info).bn}`,
        ),
        decision: info,
      };
    },
  },
  {
    id: "simple-ols",
    category: "regression",
    title: t("Simple linear regression (OLS)", "সরল রৈখিক রিগ্রেশন (OLS)"),
    description: t(
      "Estimate the line Y = a + bX, with R\u00b2 and a test for the slope.",
      "Y = a + bX রেখা অনুমান করুন, সঙ্গে R\u00b2 ও ঢালের পরীক্ষা।",
    ),
    whenToUse: t(
      "Use to quantify how much Y changes on average when X changes by one unit, and to test whether that slope is different from zero.",
      "X এক একক বাড়লে Y গড়ে কত বদলায় তা পরিমাপ করতে এবং সেই ঢাল শূন্য থেকে ভিন্ন কিনা পরীক্ষা করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Linearity, independent observations, normally distributed residuals with constant variance, and no influential outliers. Predictions outside the observed X range are extrapolation.",
      "রৈখিকতা, স্বাধীন পর্যবেক্ষণ, ধ্রুবক ভ্যারিয়েন্সসহ স্বাভাবিক রেসিডুয়াল এবং প্রভাবশালী চরম মান নেই। পর্যবেক্ষিত X সীমার বাইরে পূর্বানুমান এক্সট্রাপোলেশন।",
    ),
    formulaSummary: [
      "b = Sxy / Sxx ; a = y\u0304 \u2212 b x\u0304",
      "R\u00b2 = r\u00b2",
      "SE(b) = \u221a[SSE/(n\u22122)] / \u221aSxx",
      "t = b / SE(b) with df = n \u2212 2",
    ],
    legend: t(
      "b = slope; a = intercept; SSE = sum of squared residuals; Sxx = \u03a3(x \u2212 x\u0304)\u00b2; R\u00b2 = share of Y variation explained by X.",
      "b = ঢাল; a = ছেদবিন্দু; SSE = রেসিডুয়ালের সমষ্টি বর্গ; Sxx = \u03a3(x \u2212 x\u0304)\u00b2; R\u00b2 = X দ্বারা Y-এর ভিন্নতার ব্যাখ্যাত অংশ।",
    ),
    fields: [ALPHA_FIELD],
    tables: [XY_TABLE],
    example: {
      fields: { alpha: "0.05" },
      tables: {
        data: [
          ["10", "22"],
          ["12", "25"],
          ["15", "28"],
          ["18", "32"],
          ["20", "35"],
          ["22", "38"],
          ["25", "42"],
          ["28", "45"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const alpha = getAlpha(input);
      const pairs = pairedColumns(
        input,
        "data",
        0,
        1,
        t("Paired observations", "জোড়াভিত্তিক পর্যবেক্ষণ"),
        t("X", "X"),
        t("Y", "Y"),
      );
      if (pairs.a.length < 3) {
        throw new CalcInputError(
          t("Enter at least three complete pairs.", "অন্তত তিনটি পূর্ণ জোড়া লিখুন।"),
        );
      }
      const result = simpleOls(pairs.a, pairs.b);
      const info = decision(result.pValue, alpha);
      const sign = result.intercept >= 0 ? "+" : "\u2212";

      return {
        metrics: [
          { label: t("Pairs (n)", "জোড়া (n)"), value: String(result.n) },
          { label: t("Slope (b)", "ঢাল (b)"), value: formatNumber(result.slope, 4) },
          { label: t("Intercept (a)", "ছেদবিন্দু (a)"), value: formatNumber(result.intercept, 4) },
          { label: t("R\u00b2", "R\u00b2"), value: formatNumber(result.rSquared, 4) },
          { label: t("Std. error of slope", "ঢালের আদর্শ ত্রুটি"), value: formatNumber(result.standardErrorSlope, 4) },
          { label: t("t statistic", "t পরিসংখ্যান"), value: formatNumber(result.statistic, 4) },
          { label: t("Degrees of freedom", "স্বাধীনতার মাত্রা"), value: String(result.df) },
          pMetric(result.pValue),
          ciMetric(result.slopeInterval, 3, t("95% CI for the slope", "ঢালের ৯৫% আস্থা ব্যবধান")),
          decisionMetric(info),
        ],
        steps: [
          {
            title: t("Hypotheses", "অনুমান"),
            formula: "H\u2080: \u03b2\u2081 = 0 ; H\u2081: \u03b2\u2081 \u2260 0",
            note: t(
              "\u03b2\u2081 is the population slope: the average change in Y per one-unit change in X.",
              "\u03b2\u2081 হলো জনসংখ্যার ঢাল: X এক একক বাড়লে Y-এর গড় পরিবর্তন।",
            ),
          },
          {
            title: t("Estimated line", "অনুমিত রেখা"),
            formula: "Y\u0302 = a + bX",
            substitution: `Y\u0302 = ${formatNumber(result.intercept, 3)} ${sign} ${formatNumber(Math.abs(result.slope), 3)}X`,
          },
          {
            title: t("Slope and intercept", "ঢাল ও ছেদবিন্দু"),
            formula: "b = Sxy / Sxx ; a = y\u0304 \u2212 b x\u0304",
            substitution: `b = ${formatNumber(result.slope, 4)} ; a = ${formatNumber(result.intercept, 4)}`,
          },
          {
            title: t("Goodness of fit", "সামঞ্জস্য"),
            formula: "R\u00b2 = 1 \u2212 SSE/SST",
            substitution: `R\u00b2 = ${formatNumber(result.rSquared, 4)}`,
          },
          {
            title: t("Slope test", "ঢাল পরীক্ষা"),
            formula: "t = b / SE(b)",
            substitution: `t = ${formatNumber(result.slope, 3)} / ${formatNumber(result.standardErrorSlope, 3)} = ${formatNumber(result.statistic, 3)}; df = ${result.df}`,
            note: conclusion(info),
          },
        ],
        interpretation: t(
          `On average, Y changes by ${formatNumber(result.slope, 3)} when X increases by one unit. X explains about ${formatNumber(result.rSquared * 100, 1)}% of the variation in Y. ${conclusion(info).en}`,
          `X এক একক বাড়লে Y গড়ে ${formatNumber(result.slope, 3)} পরিবর্তিত হয়। X, Y-এর ভিন্নতার প্রায় ${formatNumber(result.rSquared * 100, 1)}% ব্যাখ্যা করে। ${conclusion(info).bn}`,
        ),
        decision: info,
        warnings: [
          t(
            "Regression describes association and prediction within the observed range. It does not prove that X causes Y.",
            "রিগ্রেশন পর্যবেক্ষিত সীমার মধ্যে সম্পর্ক ও পূর্বানুমান বর্ণনা করে। এটি X থেকে Y-এর কারণ প্রমাণ করে না।",
          ),
        ],
      };
    },
  },
];
