import {
  formatNumber,
  formatPercent,
  isBlank,
  numberField,
  optionalNumberField,
  parseCell,
} from "@/lib/econ-math/io";
import {
  annuity,
  compoundInterest,
  effectiveAnnualRate,
  internalRateOfReturn,
  loanEmi,
  netPresentValue,
  paybackPeriod,
  solveLumpSum,
  straightLineDepreciation,
} from "@/lib/econ-math/finance";
import { breakEven } from "@/lib/econ-math/micro";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorInput,
  type CalculatorResult,
  type Metric,
} from "@/lib/econ-math/types";

const RATE_HELP = t(
  "Enter the rate as a decimal: 8% is 0.08.",
  "হার দশমিক হিসেবে লিখুন: ৮% হলে 0.08।",
);

const COMPOUNDING_OPTIONS = [
  { value: "1", label: t("Annually", "বার্ষিক") },
  { value: "2", label: t("Semiannually", "ষাণ্মাসিক") },
  { value: "4", label: t("Quarterly", "ত্রৈমাসিক") },
  { value: "12", label: t("Monthly", "মাসিক") },
  { value: "365", label: t("Daily", "দৈনিক") },
  { value: "0", label: t("Continuous", "নিরবচ্ছিন্ন") },
];

const CASH_FLOW_TABLE = {
  key: "data",
  label: t("Cash flows", "নগদ প্রবাহ"),
  description: t(
    "Enter one cash flow per row in time order. Row 1 is time 0, usually a negative initial investment.",
    "সময় অনুযায়ী প্রতি সারিতে একটি নগদ প্রবাহ লিখুন। প্রথম সারি সময় ০, সাধারণত ঋণাত্মক প্রাথমিক বিনিয়োগ।",
  ),
  columns: [{ key: "cf", label: t("Cash flow", "নগদ প্রবাহ") }],
  minRows: 2,
  maxRows: 200,
  initialRows: 6,
  addRowLabel: t("Add period", "সময় যোগ করুন"),
};

function readCashFlows(input: CalculatorInput): number[] {
  const table = input.tables.data;
  if (!table) {
    throw new CalcInputError(t("The cash-flow table is missing.", "নগদ প্রবাহের টেবিল পাওয়া যায়নি।"));
  }
  const values: number[] = [];
  let seenBlank = false;

  table.rows.forEach((row, index) => {
    const raw = row[0] ?? "";
    if (isBlank(raw)) {
      seenBlank = true;
      return;
    }
    if (seenBlank) {
      throw new CalcInputError(
        t(
          `Row ${index + 1}: cash flows must be continuous. Fill the blank rows above or remove them.`,
          `${index + 1} নম্বর সারি: নগদ প্রবাহ ধারাবাহিক হতে হবে। উপরের খালি সারি পূরণ করুন বা সরান।`,
        ),
      );
    }
    const value = parseCell(raw);
    if (value === null || Number.isNaN(value)) {
      throw new CalcInputError(
        t(
          `Row ${index + 1}: cash flow must be a number.`,
          `${index + 1} নম্বর সারি: নগদ প্রবাহ সংখ্যা হতে হবে।`,
        ),
      );
    }
    values.push(value);
  });

  if (values.length < 2) {
    throw new CalcInputError(
      t("Enter at least two cash flows, including time 0.", "সময় ০ সহ অন্তত দুটি নগদ প্রবাহ লিখুন।"),
    );
  }
  return values;
}

function npvDecision(npv: number, rate: number): Metric {
  return {
    label: t("Investment decision", "বিনিয়োগ সিদ্ধান্ত"),
    value:
      npv > 0
        ? t(`Accept: NPV is positive at ${formatPercent(rate)}`, `${formatPercent(rate)}-এ NPV ধনাত্মক: গ্রহণযোগ্য`)
        : npv < 0
          ? t(`Reject: NPV is negative at ${formatPercent(rate)}`, `${formatPercent(rate)}-এ NPV ঋণাত্মক: অগ্রহণযোগ্য`)
          : t("Indifferent: NPV is zero", "নিরপেক্ষ: NPV শূন্য"),
    tone: npv > 0 ? "brand" : npv < 0 ? "warning" : "default",
  };
}

export const financeCalculators: CalculatorDef[] = [
  {
    id: "compound-interest",
    category: "finance",
    title: t("Simple & compound interest", "সরল ও যৌগিক সুদ"),
    description: t(
      "Compare simple interest with compound interest and find the effective annual rate.",
      "সরল সুদের সঙ্গে যৌগিক সুদের তুলনা করুন এবং কার্যকর বার্ষিক হার বের করুন।",
    ),
    whenToUse: t(
      "Use for savings, deposits, or loans where the nominal rate and compounding frequency are known.",
      "সঞ্চয়, আমানত বা ঋণের ক্ষেত্রে ব্যবহার করুন যেখানে নামমাত্র হার ও যৌগিক সময় জানা।",
    ),
    assumptions: t(
      "The nominal rate is constant and no additional deposits or withdrawals occur. Continuous compounding uses e^(rt).",
      "নামমাত্র হার ধ্রুবক এবং অতিরিক্ত জমা বা উত্তোলন নেই। নিরবচ্ছিন্ন যৌগিক ব্যবহারে e^(rt)।",
    ),
    formulaSummary: [
      "Simple: FV = P(1 + rt)",
      "Compound: FV = P(1 + r/m)^(mt)",
      "Continuous: FV = Pe^(rt)",
      "EAR = (1 + r/m)^m \u2212 1",
    ],
    legend: t(
      "P = principal; r = annual nominal rate; t = years; m = compounding periods per year; EAR = effective annual rate.",
      "P = মূলধন; r = বার্ষিক নামমাত্র হার; t = বছর; m = বছরে যৌগিক সময়; EAR = কার্যকর বার্ষিক হার।",
    ),
    fields: [
      { key: "principal", label: t("Principal (P)", "মূলধন (P)"), defaultValue: "100000", kind: "number" },
      { key: "rate", label: t("Annual nominal rate (r)", "বার্ষিক নামমাত্র হার (r)"), help: RATE_HELP, defaultValue: "0.08", kind: "number" },
      { key: "years", label: t("Years (t)", "বছর (t)"), defaultValue: "5", kind: "number" },
      { key: "compounding", label: t("Compounding", "যৌগিক সময়"), defaultValue: "12", kind: "select", options: COMPOUNDING_OPTIONS },
    ],
    tables: [],
    example: {
      fields: { principal: "100000", rate: "0.08", years: "5", compounding: "12" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const principal = numberField(input, "principal", t("The principal", "মূলধন"));
      const rate = numberField(input, "rate", t("The annual nominal rate", "বার্ষিক নামমাত্র হার"));
      const years = numberField(input, "years", t("The number of years", "বছরের সংখ্যা"));
      const compounding = Number(input.fields.compounding ?? "12");
      if (!Number.isFinite(compounding) || compounding < 0) {
        throw new CalcInputError(t("Choose a valid compounding option.", "বৈধ যৌগিক সময় বেছে নিন।"));
      }
      const result = compoundInterest(principal, rate, years, compounding);
      const periods =
        compounding === 0 ? "\u221e (continuous)" : String(compounding);

      return {
        metrics: [
          { label: t("Compound future value", "যৌগিক ভবিষ্যৎ মূল্য"), value: formatNumber(result.compoundFutureValue, 2), tone: "brand" },
          { label: t("Compound interest earned", "যৌগিক সুদ"), value: formatNumber(result.compoundInterest, 2) },
          { label: t("Simple future value", "সরল ভবিষ্যৎ মূল্য"), value: formatNumber(result.simpleFutureValue, 2) },
          { label: t("Simple interest", "সরল সুদ"), value: formatNumber(result.simpleInterest, 2) },
          { label: t("Effective annual rate (EAR)", "কার্যকর বার্ষিক হার (EAR)"), value: formatPercent(result.effectiveAnnualRate) },
          { label: t("Periods per year", "বছরে সময়"), value: periods },
        ],
        steps: [
          {
            title: t("Simple interest", "সরল সুদ"),
            formula: "FV = P(1 + rt)",
            substitution: `FV = ${formatNumber(principal, 2)}(1 + ${formatNumber(rate, 4)} \u00d7 ${formatNumber(years, 3)}) = ${formatNumber(result.simpleFutureValue, 2)}`,
          },
          {
            title: t("Compound interest", "যৌগিক সুদ"),
            formula:
              compounding === 0
                ? "FV = P \u00d7 e^(rt)"
                : "FV = P(1 + r/m)^(mt)",
            substitution:
              compounding === 0
                ? `FV = ${formatNumber(principal, 2)} \u00d7 e^(${formatNumber(rate, 4)} \u00d7 ${formatNumber(years, 3)}) = ${formatNumber(result.compoundFutureValue, 2)}`
                : `FV = ${formatNumber(principal, 2)}(1 + ${formatNumber(rate, 4)}/${compounding})^(${compounding} \u00d7 ${formatNumber(years, 3)}) = ${formatNumber(result.compoundFutureValue, 2)}`,
          },
          {
            title: t("Effective annual rate", "কার্যকর বার্ষিক হার"),
            formula: "EAR = (1 + r/m)^m \u2212 1",
            substitution: `EAR = ${formatPercent(result.effectiveAnnualRate)}`,
          },
        ],
        interpretation: t(
          `The investment grows to ${formatNumber(result.compoundFutureValue, 2)} with compound interest, compared with ${formatNumber(result.simpleFutureValue, 2)} under simple interest. Compounding adds ${formatNumber(result.compoundInterest - result.simpleInterest, 2)}.`,
          `যৌগিক সুদে বিনিয়োগ ${formatNumber(result.compoundFutureValue, 2)}-এ বাড়ে, সরল সুদে ${formatNumber(result.simpleFutureValue, 2)}। যৌগিককরণ ${formatNumber(result.compoundInterest - result.simpleInterest, 2)} অতিরিক্ত যোগ করে।`,
        ),
      };
    },
  },
  {
    id: "effective-annual-rate",
    category: "finance",
    title: t("Effective annual rate (EAR)", "কার্যকর বার্ষিক হার (EAR)"),
    description: t(
      "Turn a nominal rate with any compounding frequency into a comparable annual rate.",
      "যেকোনো যৌগিক সময়ের নামমাত্র হারকে তুলনাযোগ্য বার্ষিক হারে রূপান্তর করুন।",
    ),
    whenToUse: t(
      "Use to compare loans or savings products that quote different nominal rates and compounding frequencies.",
      "ভিন্ন নামমাত্র হার ও যৌগিক সময় উল্লেখ করা ঋণ বা সঞ্চয় পণ্য তুলনা করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The nominal rate is fixed for the year and compounding occurs at the stated frequency. Continuous compounding uses e^r \u2212 1.",
      "নামমাত্র হার বছরের জন্য স্থির এবং নির্দেশিত সময়ে যৌগিক হয়। নিরবচ্ছিন্ন যৌগিক ব্যবহারে e^r \u2212 1।",
    ),
    formulaSummary: ["EAR = (1 + r/m)^m \u2212 1", "Continuous: EAR = e^r \u2212 1"],
    legend: t(
      "r = nominal annual rate; m = compounding periods per year.",
      "r = নামমাত্র বার্ষিক হার; m = বছরে যৌগিক সময়।",
    ),
    fields: [
      { key: "rate", label: t("Nominal annual rate (r)", "নামমাত্র বার্ষিক হার (r)"), help: RATE_HELP, defaultValue: "0.12", kind: "number" },
      { key: "compounding", label: t("Compounding", "যৌগিক সময়"), defaultValue: "12", kind: "select", options: COMPOUNDING_OPTIONS },
    ],
    tables: [],
    example: {
      fields: { rate: "0.12", compounding: "12" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const rate = numberField(input, "rate", t("The nominal annual rate", "নামমাত্র বার্ষিক হার"));
      const compounding = Number(input.fields.compounding ?? "12");
      if (!Number.isFinite(compounding) || compounding < 0) {
        throw new CalcInputError(t("Choose a valid compounding option.", "বৈধ যৌগিক সময় বেছে নিন।"));
      }
      const result = effectiveAnnualRate(rate, compounding);
      const periodRate = compounding === 0 ? null : rate / compounding;

      return {
        metrics: [
          { label: t("Effective annual rate", "কার্যকর বার্ষিক হার"), value: formatPercent(result.effectiveAnnualRate), tone: "brand" },
          { label: t("Nominal rate", "নামমাত্র হার"), value: formatPercent(result.nominalRate) },
          {
            label: t("Rate per compounding period", "প্রতি যৌগিক সময়ের হার"),
            value: periodRate === null ? "\u2014" : formatPercent(periodRate, 4),
          },
          { label: t("Periods per year", "বছরে সময়"), value: compounding === 0 ? "\u221e" : String(compounding) },
        ],
        steps: [
          {
            title: t("Effective annual rate", "কার্যকর বার্ষিক হার"),
            formula: compounding === 0 ? "EAR = e^r \u2212 1" : "EAR = (1 + r/m)^m \u2212 1",
            substitution:
              compounding === 0
                ? `EAR = e^${formatNumber(rate, 4)} \u2212 1 = ${formatPercent(result.effectiveAnnualRate)}`
                : `EAR = (1 + ${formatNumber(rate, 4)}/${compounding})^${compounding} \u2212 1 = ${formatPercent(result.effectiveAnnualRate)}`,
          },
        ],
        interpretation: t(
          `A nominal rate of ${formatPercent(result.nominalRate)} compounded ${compounding === 0 ? "continuously" : `${compounding} times a year`} is equivalent to ${formatPercent(result.effectiveAnnualRate)} effective annual interest.`,
          `${formatPercent(result.nominalRate)} নামমাত্র হার ${compounding === 0 ? "নিরবচ্ছিন্নভাবে" : `বছরে ${compounding} বার`} যৌগিক হলে কার্যকর বার্ষিক সুদ ${formatPercent(result.effectiveAnnualRate)}।`,
        ),
      };
    },
  },
  {
    id: "present-future-value",
    category: "finance",
    title: t("Present & future value", "বর্তমান ও ভবিষ্যৎ মূল্য"),
    description: t(
      "Move a single amount forward or backward in time using a discount rate.",
      "ছাড় হার ব্যবহার করে একটি একক অর্থকে সময়ের সামনে বা পিছনে নিন।",
    ),
    whenToUse: t(
      "Use to value a single future payment today, or to project today's amount into the future.",
      "একটি ভবিষ্যৎ অর্থের আজকের মূল্য বের করতে, বা আজকের অর্থের ভবিষ্যৎ মান অনুমান করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The rate is constant, compounding is annual, and no extra payments occur. The same rate applies to the whole period.",
      "হার ধ্রুবক, যৌগিক বার্ষিক এবং অতিরিক্ত অর্থপ্রদান নেই। পুরো সময়ে একই হার প্রযোজ্য।",
    ),
    formulaSummary: ["FV = PV(1 + r)^t", "PV = FV / (1 + r)^t"],
    legend: t(
      "PV = present value; FV = future value; r = annual rate; t = years.",
      "PV = বর্তমান মূল্য; FV = ভবিষ্যৎ মূল্য; r = বার্ষিক হার; t = বছর।",
    ),
    fields: [
      {
        key: "mode",
        label: t("What do you want to find?", "কী বের করতে চান?"),
        defaultValue: "future",
        kind: "select",
        options: [
          { value: "future", label: t("Future value from present value", "বর্তমান মূল্য থেকে ভবিষ্যৎ মূল্য") },
          { value: "present", label: t("Present value from future value", "ভবিষ্যৎ মূল্য থেকে বর্তমান মূল্য") },
        ],
      },
      { key: "amount", label: t("Amount", "পরিমাণ"), defaultValue: "100000", kind: "number" },
      { key: "rate", label: t("Annual rate (r)", "বার্ষিক হার (r)"), help: RATE_HELP, defaultValue: "0.08", kind: "number" },
      { key: "years", label: t("Years (t)", "বছর (t)"), defaultValue: "5", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { mode: "future", amount: "100000", rate: "0.08", years: "5" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const mode = input.fields.mode === "present" ? "present" : "future";
      const amount = numberField(input, "amount", t("The amount", "পরিমাণ"));
      const rate = numberField(input, "rate", t("The annual rate", "বার্ষিক হার"));
      const years = numberField(input, "years", t("The number of years", "বছরের সংখ্যা"));
      if (amount < 0) {
        throw new CalcInputError(t("The amount cannot be negative.", "পরিমাণ ঋণাত্মক হতে পারে না।"));
      }
      const result = solveLumpSum(
        mode === "future" ? amount : null,
        mode === "future" ? null : amount,
        rate,
        years,
      );

      return {
        metrics: [
          {
            label: mode === "future" ? t("Future value (FV)", "ভবিষ্যৎ মূল্য (FV)") : t("Present value (PV)", "বর্তমান মূল্য (PV)"),
            value: formatNumber(mode === "future" ? result.futureValue : result.presentValue, 2),
            tone: "brand",
          },
          { label: t("Amount entered", "প্রদত্ত পরিমাণ"), value: formatNumber(amount, 2) },
          {
            label: t("Interest / discount", "সুদ / ছাড়"),
            value: formatNumber(
              mode === "future"
                ? result.futureValue - amount
                : amount - result.presentValue,
              2,
            ),
          },
          { label: t("Rate", "হার"), value: formatPercent(rate) },
          { label: t("Years", "বছর"), value: formatNumber(years, 2) },
        ],
        steps: [
          {
            title: mode === "future" ? t("Future value", "ভবিষ্যৎ মূল্য") : t("Present value", "বর্তমান মূল্য"),
            formula: mode === "future" ? "FV = PV(1 + r)^t" : "PV = FV / (1 + r)^t",
            substitution:
              mode === "future"
                ? `FV = ${formatNumber(amount, 2)}(1 + ${formatNumber(rate, 4)})^${formatNumber(years, 2)} = ${formatNumber(result.futureValue, 2)}`
                : `PV = ${formatNumber(amount, 2)} / (1 + ${formatNumber(rate, 4)})^${formatNumber(years, 2)} = ${formatNumber(result.presentValue, 2)}`,
          },
        ],
        interpretation: t(
          mode === "future"
            ? `${formatNumber(amount, 2)} today grows to ${formatNumber(result.futureValue, 2)} in ${formatNumber(years, 1)} years at ${formatPercent(rate)}.`
            : `${formatNumber(amount, 2)} received in ${formatNumber(years, 1)} years is worth ${formatNumber(result.presentValue, 2)} today at a ${formatPercent(rate)} discount rate.`,
          mode === "future"
            ? `আজকের ${formatNumber(amount, 2)} ${formatNumber(years, 1)} বছরে ${formatPercent(rate)} হারে ${formatNumber(result.futureValue, 2)} হবে।`
            : `${formatNumber(years, 1)} বছর পরে প্রাপ্ত ${formatNumber(amount, 2)}-এর আজকের মূল্য ${formatPercent(rate)} ছাড় হারে ${formatNumber(result.presentValue, 2)}।`,
        ),
      };
    },
  },
  {
    id: "annuity",
    category: "finance",
    title: t("Annuity present & future value", "বার্ষিকীর বর্তমান ও ভবিষ্যৎ মূল্য"),
    description: t(
      "Value a series of equal payments made at the end or beginning of each period.",
      "প্রতি সময়ের শেষে বা শুরুতে সমান অর্থপ্রদানের সিরিজের মূল্য বের করুন।",
    ),
    whenToUse: t(
      "Use for regular savings deposits, pension payments, or equal instalments.",
      "নিয়মিত সঞ্চয় আমানত, পেনশন প্রদান বা সমান কিস্তির জন্য ব্যবহার করুন।",
    ),
    assumptions: t(
      "Payments are equal, evenly spaced, and the interest rate is constant. Ordinary annuities pay at period end; annuities due pay at period start.",
      "অর্থপ্রদান সমান, সমান বিরতিতে এবং সুদের হার ধ্রুবক। সাধারণ বার্ষিকী সময়ের শেষে; due বার্ষিকী সময়ের শুরুতে পরিশোধ করে।",
    ),
    formulaSummary: [
      "FV = PMT \u00d7 [((1 + r)^n \u2212 1) / r]",
      "PV = PMT \u00d7 [(1 \u2212 (1 + r)^(\u2212n)) / r]",
      "Annuity due: multiply by (1 + r)",
    ],
    legend: t(
      "PMT = payment per period; r = rate per period; n = number of payments.",
      "PMT = প্রতি সময়ের অর্থপ্রদান; r = প্রতি সময়ের হার; n = অর্থপ্রদানের সংখ্যা।",
    ),
    fields: [
      { key: "payment", label: t("Payment per period (PMT)", "প্রতি সময়ের অর্থপ্রদান (PMT)"), defaultValue: "10000", kind: "number" },
      { key: "rate", label: t("Rate per period (r)", "প্রতি সময়ের হার (r)"), help: RATE_HELP, defaultValue: "0.01", kind: "number" },
      { key: "periods", label: t("Number of payments (n)", "অর্থপ্রদানের সংখ্যা (n)"), defaultValue: "60", kind: "number" },
      {
        key: "timing",
        label: t("Payment timing", "অর্থপ্রদানের সময়"),
        defaultValue: "ordinary",
        kind: "select",
        options: [
          { value: "ordinary", label: t("End of period (ordinary)", "সময়ের শেষে (সাধারণ)") },
          { value: "due", label: t("Beginning of period (due)", "সময়ের শুরুতে (due)") },
        ],
      },
    ],
    tables: [],
    example: {
      fields: { payment: "10000", rate: "0.01", periods: "60", timing: "ordinary" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const payment = numberField(input, "payment", t("The payment per period", "প্রতি সময়ের অর্থপ্রদান"));
      const rate = numberField(input, "rate", t("The rate per period", "প্রতি সময়ের হার"));
      const periods = numberField(input, "periods", t("The number of payments", "অর্থপ্রদানের সংখ্যা"));
      if (payment < 0) {
        throw new CalcInputError(t("The payment cannot be negative.", "অর্থপ্রদান ঋণাত্মক হতে পারে না।"));
      }
      const due = input.fields.timing === "due";
      const result = annuity(payment, rate, periods, due);

      return {
        metrics: [
          { label: t("Future value", "ভবিষ্যৎ মূল্য"), value: formatNumber(result.futureValue, 2), tone: "brand" },
          { label: t("Present value", "বর্তমান মূল্য"), value: formatNumber(result.presentValue, 2) },
          { label: t("Total payments", "মোট অর্থপ্রদান"), value: formatNumber(result.totalPayments, 2) },
          { label: t("Interest / return", "সুদ / রিটার্ন"), value: formatNumber(result.futureValue - result.totalPayments, 2) },
          { label: t("Timing", "সময়"), value: due ? t("Beginning of period", "সময়ের শুরুতে") : t("End of period", "সময়ের শেষে") },
        ],
        steps: [
          {
            title: t("Future value", "ভবিষ্যৎ মূল্য"),
            formula: "FV = PMT \u00d7 [((1 + r)^n \u2212 1) / r]" + (due ? " \u00d7 (1 + r)" : ""),
            substitution: `FV = ${formatNumber(payment, 2)} \u00d7 [((1 + ${formatNumber(rate, 4)})^${formatNumber(periods, 0)} \u2212 1) / ${formatNumber(rate, 4)}] = ${formatNumber(result.futureValue, 2)}`,
          },
          {
            title: t("Present value", "বর্তমান মূল্য"),
            formula: "PV = PMT \u00d7 [(1 \u2212 (1 + r)^(\u2212n)) / r]" + (due ? " \u00d7 (1 + r)" : ""),
            substitution: `PV = ${formatNumber(result.presentValue, 2)}`,
          },
        ],
        interpretation: t(
          `${formatNumber(periods, 0)} payments of ${formatNumber(payment, 2)} are worth ${formatNumber(result.presentValue, 2)} today and accumulate to ${formatNumber(result.futureValue, 2)}.`,
          `${formatNumber(periods, 0)}টি ${formatNumber(payment, 2)} অর্থপ্রদানের আজকের মূল্য ${formatNumber(result.presentValue, 2)} এবং ভবিষ্যৎ মূল্য ${formatNumber(result.futureValue, 2)}।`,
        ),
      };
    },
  },
  {
    id: "npv",
    category: "finance",
    title: t("Net present value (NPV)", "নিট বর্তমান মূল্য (NPV)"),
    description: t(
      "Discount a stream of cash flows to today and decide whether it creates value.",
      "নগদ প্রবাহের সিরিজকে আজকের মূল্যে ছাড় করুন এবং মূল্য তৈরি করে কিনা সিদ্ধান্ত নিন।",
    ),
    whenToUse: t(
      "Use to evaluate a project or investment when you have an initial outlay and forecast cash flows.",
      "প্রাথমিক ব্যয় ও পূর্বানুমানকৃত নগদ প্রবাহ থাকলে প্রকল্প বা বিনিয়োগ মূল্যায়নে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Cash flows occur at the end of each period, the discount rate reflects the project's risk, and time 0 is the first row (usually negative).",
      "নগদ প্রবাহ প্রতি সময়ের শেষে, ছাড় হার প্রকল্পের ঝুঁকি প্রতিফলিত করে এবং সময় ০ হলো প্রথম সারি (সাধারণত ঋণাত্মক)।",
    ),
    formulaSummary: [
      "NPV = \u03a3 CF_t / (1 + r)^t",
      "Profitability index = PV of inflows / |PV of outflows|",
      "Accept when NPV > 0",
    ],
    legend: t(
      "CF_t = cash flow at time t; r = discount rate; t = period (0, 1, 2, ...).",
      "CF_t = সময় t-এ নগদ প্রবাহ; r = ছাড় হার; t = সময় (০, ১, ২, ...)।",
    ),
    fields: [
      { key: "rate", label: t("Discount rate (r)", "ছাড় হার (r)"), help: RATE_HELP, defaultValue: "0.10", kind: "number" },
    ],
    tables: [CASH_FLOW_TABLE],
    example: {
      fields: { rate: "0.10" },
      tables: {
        data: [["-100000"], ["30000"], ["35000"], ["40000"], ["25000"]],
      },
    },
    compute(input): CalculatorResult {
      const rate = numberField(input, "rate", t("The discount rate", "ছাড় হার"));
      const cashFlows = readCashFlows(input);
      const result = netPresentValue(rate, cashFlows);
      const warnings = [] as { en: string; bn: string }[];
      if (!cashFlows.some((value) => value < 0)) {
        warnings.push(
          t(
            "There is no negative cash flow. An NPV without an initial outlay only measures the present value of inflows.",
            "কোনো ঋণাত্মক নগদ প্রবাহ নেই। প্রাথমিক ব্যয় ছাড়া NPV শুধু inflow-এর বর্তমান মূল্য মাপে।",
          ),
        );
      }

      return {
        metrics: [
          { label: t("Net present value", "নিট বর্তমান মূল্য"), value: formatNumber(result.npv, 2), tone: result.npv >= 0 ? "brand" : "warning" },
          { label: t("PV of inflows", "inflow-এর বর্তমান মূল্য"), value: formatNumber(result.presentValueInflows, 2) },
          { label: t("PV of outflows", "outflow-এর বর্তমান মূল্য"), value: formatNumber(result.presentValueOutflows, 2) },
          {
            label: t("Profitability index", "লাভজনকতা সূচক"),
            value: result.profitabilityIndex === null ? "\u2014" : formatNumber(result.profitabilityIndex, 3),
          },
          npvDecision(result.npv, rate),
        ],
        tables: [
          {
            headers: ["t", "Cash flow", "Discount factor", "Present value"],
            rows: cashFlows.map((cashFlow, period) => {
              const factor = 1 / Math.pow(1 + rate, period);
              return [
                String(period),
                formatNumber(cashFlow, 2),
                formatNumber(factor, 4),
                formatNumber(cashFlow * factor, 2),
              ];
            }),
            align: ["right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Discount each cash flow", "প্রতিটি নগদ প্রবাহ ছাড় করুন"),
            formula: "PV_t = CF_t / (1 + r)^t",
            substitution: `r = ${formatPercent(rate)}`,
          },
          {
            title: t("Add the present values", "বর্তমান মূল্যগুলো যোগ করুন"),
            formula: "NPV = \u03a3 PV_t",
            substitution: `NPV = ${formatNumber(result.npv, 2)}`,
          },
          {
            title: t("Decision", "সিদ্ধান্ত"),
            formula: "Accept if NPV > 0",
            note: t(
              result.npv > 0
                ? "The project adds value at this discount rate."
                : result.npv < 0
                  ? "The project destroys value at this discount rate."
                  : "The project exactly breaks even in present-value terms.",
              result.npv > 0
                ? "এই ছাড় হারে প্রকল্প মূল্য যোগ করে।"
                : result.npv < 0
                  ? "এই ছাড় হারে প্রকল্প মূল্য নষ্ট করে।"
                  : "বর্তমান মূল্যের হিসাবে প্রকল্প ঠিক সমান।",
            ),
          },
        ],
        interpretation: t(
          `At a ${formatPercent(rate)} discount rate, the project has an NPV of ${formatNumber(result.npv, 2)}. ${result.npv > 0 ? "It is expected to add value." : result.npv < 0 ? "It is expected to reduce value." : "It breaks even."}`,
          `${formatPercent(rate)} ছাড় হারে প্রকল্পের NPV ${formatNumber(result.npv, 2)}। ${result.npv > 0 ? "এটি মূল্য যোগ করবে বলে আশা করা যায়।" : result.npv < 0 ? "এটি মূল্য কমাবে বলে আশা করা যায়।" : "এটি সমান।"}`,
        ),
        warnings,
      };
    },
  },
  {
    id: "irr",
    category: "finance",
    title: t("Internal rate of return (IRR)", "অভ্যন্তরীণ রিটার্ন হার (IRR)"),
    description: t(
      "Find the discount rate that makes a project's NPV exactly zero.",
      "যে ছাড় হারে প্রকল্পের NPV ঠিক শূন্য হয় সেই হার বের করুন।",
    ),
    whenToUse: t(
      "Use alongside NPV to compare projects, especially when you need a percentage return.",
      "NPV-এর সঙ্গে প্রকল্প তুলনা করতে ব্যবহার করুন, বিশেষ করে শতকরা রিটার্ন দরকার হলে।",
    ),
    assumptions: t(
      "Conventional cash flows (one sign change) give one IRR. Multiple sign changes can create multiple IRRs; the first root is reported with a warning.",
      "প্রচলিত নগদ প্রবাহে (একবার চিহ্ন পরিবর্তন) একটি IRR পাওয়া যায়। একাধিক চিহ্ন পরিবর্তনে একাধিক IRR হতে পারে; সতর্কতা সহ প্রথম মূল দেখানো হয়।",
    ),
    formulaSummary: [
      "0 = \u03a3 CF_t / (1 + IRR)^t",
      "IRR is found by numerical bisection",
      "Accept when IRR > required return",
    ],
    legend: t(
      "CF_t = cash flow at time t; IRR = the rate that makes NPV zero.",
      "CF_t = সময় t-এ নগদ প্রবাহ; IRR = যে হারে NPV শূন্য হয়।",
    ),
    fields: [
      { key: "hurdle", label: t("Required return (optional)", "প্রত্যাশিত রিটার্ন (ঐচ্ছিক)"), help: RATE_HELP, defaultValue: "0.10", kind: "number" },
    ],
    tables: [CASH_FLOW_TABLE],
    example: {
      fields: { hurdle: "0.10" },
      tables: {
        data: [["-100000"], ["30000"], ["35000"], ["40000"], ["25000"]],
      },
    },
    compute(input): CalculatorResult {
      const hurdle = optionalNumberField(input, "hurdle", t("The required return", "প্রত্যাশিত রিটার্ন"));
      const cashFlows = readCashFlows(input);
      const result = internalRateOfReturn(cashFlows);
      const warnings = [] as { en: string; bn: string }[];
      if (result.irr === null) {
        warnings.push(
          t(
            "No IRR was found in the range \u2212100% to 1000%. Check that the cash flows include both outflows and inflows.",
            "\u2212100% থেকে 1000% সীমার মধ্যে IRR পাওয়া যায়নি। নগদ প্রবাহে outflow ও inflow দুটোই আছে কিনা যাচাই করুন।",
          ),
        );
      }
      if (result.multipleSignChanges) {
        warnings.push(
          t(
            "The cash flows change sign more than once, so more than one IRR may exist. Use NPV as the primary decision rule.",
            "নগদ প্রবাহ একাধিকবার চিহ্ন পরিবর্তন করে, তাই একাধিক IRR থাকতে পারে। মূল সিদ্ধান্তের নিয়ম হিসেবে NPV ব্যবহার করুন।",
          ),
        );
      }

      const decisionMetric: Metric | null =
        result.irr === null || hurdle === null
          ? null
          : {
              label: t("Investment decision", "বিনিয়োগ সিদ্ধান্ত"),
              value:
                result.irr > hurdle
                  ? t(`Accept: IRR is above ${formatPercent(hurdle)}`, `গ্রহণযোগ্য: IRR ${formatPercent(hurdle)}-এর বেশি`)
                  : t(`Reject: IRR is not above ${formatPercent(hurdle)}`, `অগ্রহণযোগ্য: IRR ${formatPercent(hurdle)}-এর বেশি নয়`),
              tone: result.irr > hurdle ? "brand" : "warning",
            };

      return {
        metrics: [
          {
            label: t("Internal rate of return", "অভ্যন্তরীণ রিটার্ন হার"),
            value: result.irr === null ? "\u2014" : formatPercent(result.irr, 3),
            tone: "brand",
          },
          {
            label: t("NPV at IRR", "IRR-এ NPV"),
            value: result.npvAtIrr === null ? "\u2014" : formatNumber(result.npvAtIrr, 6),
          },
          { label: t("Sign changes", "চিহ্ন পরিবর্তন"), value: String(result.multipleSignChanges ? "> 1" : "1") },
          { label: t("Required return", "প্রত্যাশিত রিটার্ন"), value: hurdle === null ? "\u2014" : formatPercent(hurdle) },
          ...(decisionMetric ? [decisionMetric] : []),
        ],
        steps: [
          {
            title: t("Define IRR", "IRR সংজ্ঞা"),
            formula: "0 = CF\u2080 + CF\u2081/(1+IRR) + CF\u2082/(1+IRR)\u00b2 + \u2026",
            note: t(
              "The IRR is the discount rate at which the present value of inflows equals the present value of outflows.",
              "IRR হলো সেই ছাড় হার যেখানে inflow-এর বর্তমান মূল্য outflow-এর বর্তমান মূল্যের সমান।",
            ),
          },
          {
            title: t("Solve numerically", "সংখ্যাগতভাবে সমাধান"),
            formula: "NPV(IRR) = 0",
            substitution: result.irr === null ? "\u2014" : `IRR = ${formatPercent(result.irr, 3)}`,
          },
        ],
        interpretation: t(
          result.irr === null
            ? "No internal rate of return could be found for these cash flows."
            : `The project earns an internal rate of return of ${formatPercent(result.irr, 2)}. ${hurdle === null ? "" : result.irr > hurdle ? `This is above the required return of ${formatPercent(hurdle)}.` : `This is below the required return of ${formatPercent(hurdle)}.`}`,
          result.irr === null
            ? "এই নগদ প্রবাহের জন্য কোনো অভ্যন্তরীণ রিটার্ন হার পাওয়া যায়নি।"
            : `প্রকল্পের অভ্যন্তরীণ রিটার্ন হার ${formatPercent(result.irr, 2)}। ${hurdle === null ? "" : result.irr > hurdle ? `এটি প্রত্যাশিত রিটার্ন ${formatPercent(hurdle)}-এর বেশি।` : `এটি প্রত্যাশিত রিটার্ন ${formatPercent(hurdle)}-এর কম।`}`,
        ),
        warnings,
      };
    },
  },
  {
    id: "payback",
    category: "finance",
    title: t("Payback & discounted payback", "পেব্যাক ও ছাড়যুক্ত পেব্যাক"),
    description: t(
      "See how long it takes for cumulative cash flows to recover the initial investment.",
      "প্রাথমিক বিনিয়োগ ফিরে পেতে ক্রমপুঞ্জিত নগদ প্রবাহের কত সময় লাগে দেখুন।",
    ),
    whenToUse: t(
      "Use as a quick liquidity screen alongside NPV and IRR, not as the only decision rule.",
      "NPV ও IRR-এর সঙ্গে দ্রুত তারল্য যাচাইয়ের জন্য ব্যবহার করুন, একমাত্র সিদ্ধান্তের নিয়ম হিসেবে নয়।",
    ),
    assumptions: t(
      "Cash flows occur at period end and are spread evenly within the recovery period for the fractional-year interpolation. Payback ignores cash flows after recovery.",
      "নগদ প্রবাহ সময়ের শেষে এবং পুনরুদ্ধার সময়ের মধ্যে সমানভাবে ছড়ানো ধরা হয়। পেব্যাক পুনরুদ্ধারের পরের নগদ প্রবাহ উপেক্ষা করে।",
    ),
    formulaSummary: [
      "Cumulative CF_t = \u03a3 CF up to t",
      "Payback = last negative year + |cumulative| / next cash flow",
      "Discounted payback uses CF_t / (1 + r)^t",
    ],
    legend: t(
      "r = discount rate; CF = cash flow. The fractional year assumes the recovery cash flow arrives evenly through the year.",
      "r = ছাড় হার; CF = নগদ প্রবাহ। ভগ্নাংশ বছর ধরে পুনরুদ্ধার নগদ প্রবাহ সারা বছরে সমানভাবে আসে ধরা হয়।",
    ),
    fields: [
      { key: "rate", label: t("Discount rate (r)", "ছাড় হার (r)"), help: RATE_HELP, defaultValue: "0.10", kind: "number" },
    ],
    tables: [CASH_FLOW_TABLE],
    example: {
      fields: { rate: "0.10" },
      tables: {
        data: [["-100000"], ["30000"], ["35000"], ["40000"], ["25000"]],
      },
    },
    compute(input): CalculatorResult {
      const rate = numberField(input, "rate", t("The discount rate", "ছাড় হার"));
      const cashFlows = readCashFlows(input);
      const result = paybackPeriod(rate, cashFlows);
      const warnings = [] as { en: string; bn: string }[];

      if (result.payback === null) {
        warnings.push(
          t(
            "The cumulative undiscounted cash flow never becomes positive, so the investment is not recovered in the periods shown.",
            "ক্রমপুঞ্জিত অবছাড় নগদ প্রবাহ কখনো ধনাত্মক হয় না, তাই দেখানো সময়ের মধ্যে বিনিয়োগ ফিরে আসে না।",
          ),
        );
      }
      if (result.discountedPayback === null) {
        warnings.push(
          t(
            "The discounted cash flows never recover the initial outlay within the periods shown.",
            "ছাড়যুক্ত নগদ প্রবাহ দেখানো সময়ের মধ্যে প্রাথমিক ব্যয় পুনরুদ্ধার করে না।",
          ),
        );
      }

      return {
        metrics: [
          {
            label: t("Payback period", "পেব্যাক সময়"),
            value: result.payback === null ? "Not recovered" : `${formatNumber(result.payback, 2)} periods`,
            tone: result.payback === null ? "warning" : "brand",
          },
          {
            label: t("Discounted payback", "ছাড়যুক্ত পেব্যাক"),
            value: result.discountedPayback === null ? "Not recovered" : `${formatNumber(result.discountedPayback, 2)} periods`,
            tone: result.discountedPayback === null ? "warning" : "brand",
          },
          { label: t("Total undiscounted cash flow", "মোট অবছাড় নগদ প্রবাহ"), value: formatNumber(result.totalUndiscounted, 2) },
          { label: t("Total discounted cash flow", "মোট ছাড়যুক্ত নগদ প্রবাহ"), value: formatNumber(result.totalDiscounted, 2) },
        ],
        tables: [
          {
            headers: ["t", "Cash flow", "Cumulative", "Discounted", "Discounted cumulative"],
            rows: result.rows.map((row) => [
              String(row.period),
              formatNumber(row.cashFlow, 2),
              formatNumber(row.cumulative, 2),
              formatNumber(row.discounted, 2),
              formatNumber(row.discountedCumulative, 2),
            ]),
            align: ["right", "right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Cumulative cash flow", "ক্রমপুঞ্জিত নগদ প্রবাহ"),
            formula: "Cumulative_t = Cumulative_{t\u22121} + CF_t",
            substitution: result.rows
              .slice(0, 4)
              .map((row) => `${row.period}: ${formatNumber(row.cumulative, 2)}`)
              .join("  \u00b7  "),
          },
          {
            title: t("Payback interpolation", "পেব্যাক ইন্টারপোলেশন"),
            formula: "Payback = year before recovery + |cumulative| / cash flow in recovery year",
            substitution: result.payback === null ? "\u2014" : `${formatNumber(result.payback, 2)} periods`,
          },
          {
            title: t("Discounted payback", "ছাড়যুক্ত পেব্যাক"),
            formula: "Discount each CF by (1 + r)^t, then repeat",
            substitution: result.discountedPayback === null ? "\u2014" : `${formatNumber(result.discountedPayback, 2)} periods`,
          },
        ],
        interpretation: t(
          result.payback === null
            ? "The initial investment is not recovered by the cash flows entered."
            : `The initial investment is recovered in about ${formatNumber(result.payback, 2)} periods on an undiscounted basis and ${result.discountedPayback === null ? "not at all" : `${formatNumber(result.discountedPayback, 2)} periods`} after discounting.`,
          result.payback === null
            ? "প্রদত্ত নগদ প্রবাহে প্রাথমিক বিনিয়োগ ফিরে আসে না।"
            : `অবছাড় হিসাবে প্রাথমিক বিনিয়োগ প্রায় ${formatNumber(result.payback, 2)} সময়ে এবং ছাড়ের পর ${result.discountedPayback === null ? "কখনোই না" : `${formatNumber(result.discountedPayback, 2)} সময়ে`} ফিরে আসে।`,
        ),
        warnings,
      };
    },
  },
  {
    id: "break-even",
    category: "finance",
    title: t("Break-even analysis", "ব্রেক-ইভেন বিশ্লেষণ"),
    description: t(
      "Find the sales volume where revenue just covers fixed and variable costs.",
      "যে বিক্রয় পরিমাণে আয় স্থির ও পরিবর্তনশীল ব্যয় ঠিক পূরণ করে তা বের করুন।",
    ),
    whenToUse: t(
      "Use for pricing, product launches, and capacity planning when costs split into fixed and per-unit variable costs.",
      "ব্যয় স্থির ও প্রতি একক পরিবর্তনশীল ভাগে বিভক্ত হলে দাম নির্ধারণ, নতুন পণ্য ও সক্ষমতা পরিকল্পনায় ব্যবহার করুন।",
    ),
    assumptions: t(
      "Price and variable cost per unit are constant, fixed costs do not change with volume, and all units produced are sold.",
      "প্রতি একক দাম ও পরিবর্তনশীল ব্যয় ধ্রুবক, স্থির ব্যয় পরিমাণের সঙ্গে বদলায় না এবং উৎপাদিত সব একক বিক্রি হয়।",
    ),
    formulaSummary: [
      "Contribution margin = Price \u2212 Variable cost",
      "Break-even units = Fixed cost / Contribution margin",
      "Break-even revenue = Break-even units \u00d7 Price",
      "Margin of safety = Expected units \u2212 Break-even units",
    ],
    legend: t(
      "Contribution margin is the amount each unit contributes toward fixed costs and profit.",
      "কন্ট্রিবিউশন মার্জিন হলো প্রতিটি একক স্থির ব্যয় ও মুনাফায় যে পরিমাণ যোগ করে।",
    ),
    fields: [
      { key: "fixed", label: t("Fixed cost", "স্থির ব্যয়"), defaultValue: "50000", kind: "number" },
      { key: "price", label: t("Price per unit", "প্রতি একক দাম"), defaultValue: "500", kind: "number" },
      { key: "variable", label: t("Variable cost per unit", "প্রতি একক পরিবর্তনশীল ব্যয়"), defaultValue: "300", kind: "number" },
      { key: "expected", label: t("Expected sales units (optional)", "প্রত্যাশিত বিক্রয় একক (ঐচ্ছিক)"), defaultValue: "400", kind: "number" },
      { key: "target", label: t("Target profit (optional)", "লক্ষ্য মুনাফা (ঐচ্ছিক)"), defaultValue: "", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { fixed: "50000", price: "500", variable: "300", expected: "400", target: "" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const fixed = numberField(input, "fixed", t("The fixed cost", "স্থির ব্যয়"));
      const price = numberField(input, "price", t("The price per unit", "প্রতি একক দাম"));
      const variable = numberField(input, "variable", t("The variable cost per unit", "প্রতি একক পরিবর্তনশীল ব্যয়"));
      const expected = optionalNumberField(input, "expected", t("Expected sales units", "প্রত্যাশিত বিক্রয় একক"));
      const target = optionalNumberField(input, "target", t("The target profit", "লক্ষ্য মুনাফা"));
      if (fixed < 0 || price < 0 || variable < 0) {
        throw new CalcInputError(t("Costs and price cannot be negative.", "ব্যয় ও দাম ঋণাত্মক হতে পারে না।"));
      }
      const result = breakEven(fixed, price, variable, expected, target);

      return {
        metrics: [
          { label: t("Contribution margin per unit", "প্রতি একক কন্ট্রিবিউশন মার্জিন"), value: formatNumber(result.contributionMargin, 2) },
          { label: t("Break-even units", "ব্রেক-ইভেন একক"), value: formatNumber(result.breakEvenUnits, 2), tone: "brand" },
          { label: t("Break-even revenue", "ব্রেক-ইভেন আয়"), value: formatNumber(result.breakEvenRevenue, 2) },
          {
            label: t("Margin of safety (units)", "নিরাপত্তার ব্যবধান (একক)"),
            value: result.marginOfSafetyUnits === null ? "\u2014" : formatNumber(result.marginOfSafetyUnits, 2),
          },
          {
            label: t("Margin of safety (%)", "নিরাপত্তার ব্যবধান (%)"),
            value: result.marginOfSafetyPercent === null ? "\u2014" : formatPercent(result.marginOfSafetyPercent),
          },
          {
            label: t("Units for target profit", "লক্ষ্য মুনাফার একক"),
            value: result.targetProfitUnits === null ? "\u2014" : formatNumber(result.targetProfitUnits, 2),
          },
        ],
        steps: [
          {
            title: t("Contribution margin", "কন্ট্রিবিউশন মার্জিন"),
            formula: "CM = Price \u2212 Variable cost",
            substitution: `CM = ${formatNumber(price, 2)} \u2212 ${formatNumber(variable, 2)} = ${formatNumber(result.contributionMargin, 2)}`,
          },
          {
            title: t("Break-even units", "ব্রেক-ইভেন একক"),
            formula: "Q = Fixed cost / CM",
            substitution: `Q = ${formatNumber(fixed, 2)} / ${formatNumber(result.contributionMargin, 2)} = ${formatNumber(result.breakEvenUnits, 2)}`,
          },
          {
            title: t("Break-even revenue", "ব্রেক-ইভেন আয়"),
            formula: "Revenue = Q \u00d7 Price",
            substitution: `${formatNumber(result.breakEvenUnits, 2)} \u00d7 ${formatNumber(price, 2)} = ${formatNumber(result.breakEvenRevenue, 2)}`,
          },
        ],
        interpretation: t(
          `The business must sell ${formatNumber(result.breakEvenUnits, 1)} units (${formatNumber(result.breakEvenRevenue, 2)} in revenue) to cover its costs. ${result.marginOfSafetyUnits === null ? "" : result.marginOfSafetyUnits >= 0 ? `Expected sales are ${formatNumber(result.marginOfSafetyUnits, 1)} units above break-even.` : `Expected sales are ${formatNumber(Math.abs(result.marginOfSafetyUnits), 1)} units below break-even.`}`,
          `ব্যয় পূরণ করতে ব্যবসাকে ${formatNumber(result.breakEvenUnits, 1)} একক (${formatNumber(result.breakEvenRevenue, 2)} আয়) বিক্রি করতে হবে। ${result.marginOfSafetyUnits === null ? "" : result.marginOfSafetyUnits >= 0 ? `প্রত্যাশিত বিক্রয় ব্রেক-ইভেনের চেয়ে ${formatNumber(result.marginOfSafetyUnits, 1)} একক বেশি।` : `প্রত্যাশিত বিক্রয় ব্রেক-ইভেনের চেয়ে ${formatNumber(Math.abs(result.marginOfSafetyUnits), 1)} একক কম।`}`,
        ),
      };
    },
  },
  {
    id: "loan-emi",
    category: "finance",
    title: t("Loan EMI & amortisation", "ঋণের ইএমআই ও পরিশোধ সূচি"),
    description: t(
      "Monthly instalment, total interest, and a yearly amortisation summary.",
      "মাসিক কিস্তি, মোট সুদ এবং বার্ষিক পরিশোধ সারসংক্ষেপ।",
    ),
    whenToUse: t(
      "Use for a fixed-rate, fully amortising loan with equal monthly payments.",
      "সমান মাসিক কিস্তিসহ স্থির হারের সম্পূর্ণ পরিশোধযোগ্য ঋণের জন্য ব্যবহার করুন।",
    ),
    assumptions: t(
      "The annual rate is fixed, payments are monthly, and interest is charged on the outstanding balance. Fees and taxes are excluded.",
      "বার্ষিক হার স্থির, অর্থপ্রদান মাসিক এবং সুদ বকেয়া ব্যালেন্সের ওপর ধার্য হয়। ফি ও কর বাদ।",
    ),
    formulaSummary: [
      "EMI = P \u00d7 r(1 + r)^n / [(1 + r)^n \u2212 1]",
      "r = annual rate / 12 ; n = months",
      "Total interest = EMI \u00d7 n \u2212 P",
    ],
    legend: t(
      "P = loan principal; r = monthly interest rate; n = number of monthly payments.",
      "P = ঋণের মূলধন; r = মাসিক সুদের হার; n = মাসিক কিস্তির সংখ্যা।",
    ),
    fields: [
      { key: "principal", label: t("Loan amount (P)", "ঋণের পরিমাণ (P)"), defaultValue: "1000000", kind: "number" },
      { key: "rate", label: t("Annual interest rate", "বার্ষিক সুদের হার"), help: RATE_HELP, defaultValue: "0.09", kind: "number" },
      { key: "months", label: t("Term in months (n)", "মেয়াদ মাসে (n)"), defaultValue: "60", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { principal: "1000000", rate: "0.09", months: "60" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const principal = numberField(input, "principal", t("The loan amount", "ঋণের পরিমাণ"));
      const rate = numberField(input, "rate", t("The annual interest rate", "বার্ষিক সুদের হার"));
      const months = numberField(input, "months", t("The loan term in months", "মেয়াদ মাসে"));
      if (!Number.isInteger(months)) {
        throw new CalcInputError(t("Months must be a whole number.", "মাস পূর্ণসংখ্যা হতে হবে।"));
      }
      const result = loanEmi(principal, rate, months);
      const yearly = [] as { year: number; payment: number; interest: number; principal: number; balance: number }[];
      result.schedule.forEach((row) => {
        const year = Math.ceil(row.period / 12);
        const current = yearly[year - 1] ?? { year, payment: 0, interest: 0, principal: 0, balance: 0 };
        current.payment += row.payment;
        current.interest += row.interest;
        current.principal += row.principal;
        current.balance = row.balance;
        yearly[year - 1] = current;
      });

      return {
        metrics: [
          { label: t("Monthly payment (EMI)", "মাসিক কিস্তি (EMI)"), value: formatNumber(result.monthlyPayment, 2), tone: "brand" },
          { label: t("Total payment", "মোট পরিশোধ"), value: formatNumber(result.totalPayment, 2) },
          { label: t("Total interest", "মোট সুদ"), value: formatNumber(result.totalInterest, 2), tone: "warning" },
          { label: t("Loan amount", "ঋণের পরিমাণ"), value: formatNumber(result.principal, 2) },
          { label: t("Term", "মেয়াদ"), value: `${result.months} months` },
          { label: t("Monthly rate", "মাসিক হার"), value: formatPercent(rate / 12, 4) },
        ],
        tables: [
          {
            title: t("Yearly amortisation summary", "বার্ষিক পরিশোধ সারসংক্ষেপ"),
            headers: ["Year", "Payments", "Interest", "Principal", "Balance"],
            rows: yearly.map((row) => [
              String(row.year),
              formatNumber(row.payment, 2),
              formatNumber(row.interest, 2),
              formatNumber(row.principal, 2),
              formatNumber(row.balance, 2),
            ]),
            align: ["right", "right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Monthly rate", "মাসিক হার"),
            formula: "r = annual rate / 12",
            substitution: `r = ${formatNumber(rate, 4)} / 12 = ${formatNumber(rate / 12, 6)}`,
          },
          {
            title: t("Equated monthly instalment", "সমান মাসিক কিস্তি"),
            formula: "EMI = P \u00d7 r(1 + r)^n / [(1 + r)^n \u2212 1]",
            substitution: `EMI = ${formatNumber(principal, 2)} \u00d7 ... = ${formatNumber(result.monthlyPayment, 2)}`,
          },
          {
            title: t("Total interest", "মোট সুদ"),
            formula: "Total interest = EMI \u00d7 n \u2212 P",
            substitution: `${formatNumber(result.monthlyPayment, 2)} \u00d7 ${months} \u2212 ${formatNumber(principal, 2)} = ${formatNumber(result.totalInterest, 2)}`,
          },
        ],
        interpretation: t(
          `The loan requires ${formatNumber(result.monthlyPayment, 2)} per month for ${months} months. Total payments are ${formatNumber(result.totalPayment, 2)}, of which ${formatNumber(result.totalInterest, 2)} is interest.`,
          `ঋণে ${months} মাসে প্রতি মাসে ${formatNumber(result.monthlyPayment, 2)} দিতে হবে। মোট পরিশোধ ${formatNumber(result.totalPayment, 2)}, যার মধ্যে সুদ ${formatNumber(result.totalInterest, 2)}।`,
        ),
      };
    },
  },
  {
    id: "depreciation",
    category: "finance",
    title: t("Straight-line depreciation", "সরলরেখা অবচয়"),
    description: t(
      "Spread an asset's depreciable cost evenly over its useful life.",
      "সম্পদের অবচয়যোগ্য ব্যয় সমানভাবে এর ব্যবহারযোগ্য জীবনে ভাগ করুন।",
    ),
    whenToUse: t(
      "Use when the asset provides roughly equal benefits each year and you need a simple accounting schedule.",
      "সম্পদ প্রতি বছর মোটামুটি সমান সুবিধা দিলে এবং সরল হিসাব সূচি দরকার হলে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The asset is used for exactly the stated life, salvage value is known, and depreciation starts in year 1. No revaluation or impairment is modelled.",
      "সম্পদ ঠিক নির্দেশিত জীবনকাল ব্যবহার হয়, উদ্ধার মূল্য জানা এবং অবচয় প্রথম বছর থেকেই শুরু। পুনর্মূল্যায়ন বা মূল্য হ্রাস মডেল করা হয় না।",
    ),
    formulaSummary: [
      "Annual depreciation = (Cost \u2212 Salvage) / Useful life",
      "Book value_t = Cost \u2212 Accumulated depreciation",
    ],
    legend: t(
      "Cost = purchase cost; salvage = expected residual value; life = useful life in years.",
      "Cost = ক্রয়মূল্য; salvage = প্রত্যাশিত অবশিষ্ট মূল্য; life = ব্যবহারযোগ্য জীবন (বছর)।",
    ),
    fields: [
      { key: "cost", label: t("Asset cost", "সম্পদের ব্যয়"), defaultValue: "500000", kind: "number" },
      { key: "salvage", label: t("Salvage value", "উদ্ধার মূল্য"), defaultValue: "50000", kind: "number" },
      { key: "life", label: t("Useful life (years)", "ব্যবহারযোগ্য জীবন (বছর)"), defaultValue: "5", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { cost: "500000", salvage: "50000", life: "5" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const cost = numberField(input, "cost", t("The asset cost", "সম্পদের ব্যয়"));
      const salvage = numberField(input, "salvage", t("The salvage value", "উদ্ধার মূল্য"));
      const life = numberField(input, "life", t("The useful life", "ব্যবহারযোগ্য জীবন"));
      if (!Number.isInteger(life)) {
        throw new CalcInputError(t("Useful life must be a whole number of years.", "ব্যবহারযোগ্য জীবন পূর্ণ বছরে হতে হবে।"));
      }
      const result = straightLineDepreciation(cost, salvage, life);

      return {
        metrics: [
          { label: t("Annual depreciation", "বার্ষিক অবচয়"), value: formatNumber(result.annualDepreciation, 2), tone: "brand" },
          { label: t("Total depreciation", "মোট অবচয়"), value: formatNumber(result.totalDepreciation, 2) },
          { label: t("Book value after useful life", "ব্যবহারযোগ্য জীবনের পর বহি মূল্য"), value: formatNumber(cost - result.totalDepreciation, 2) },
          { label: t("Useful life", "ব্যবহারযোগ্য জীবন"), value: `${life} years` },
        ],
        tables: [
          {
            headers: ["Year", "Depreciation", "Accumulated", "Book value"],
            rows: result.schedule.map((row) => [
              String(row.year),
              formatNumber(row.depreciation, 2),
              formatNumber(row.accumulated, 2),
              formatNumber(row.bookValue, 2),
            ]),
            align: ["right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Annual depreciation", "বার্ষিক অবচয়"),
            formula: "Annual = (Cost \u2212 Salvage) / Life",
            substitution: `Annual = (${formatNumber(cost, 2)} \u2212 ${formatNumber(salvage, 2)}) / ${life} = ${formatNumber(result.annualDepreciation, 2)}`,
          },
          {
            title: t("Book value", "বহি মূল্য"),
            formula: "Book value_t = Cost \u2212 (Annual depreciation \u00d7 t)",
            substitution: `Book value_${life} = ${formatNumber(cost - result.totalDepreciation, 2)}`,
          },
        ],
        interpretation: t(
          `The asset loses ${formatNumber(result.annualDepreciation, 2)} in value each year and ends at its ${formatNumber(salvage, 2)} salvage value after ${life} years.`,
          `সম্পদ প্রতি বছর ${formatNumber(result.annualDepreciation, 2)} মূল্য হারায় এবং ${life} বছর পরে ${formatNumber(salvage, 2)} উদ্ধার মূল্যে পৌঁছায়।`,
        ),
      };
    },
  },
];
