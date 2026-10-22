import { formatNumber, formatPValue } from "@/lib/econ-math/io";
import {
  t,
  type BiText,
  type DecisionInfo,
  type FieldSpec,
  type Metric,
} from "@/lib/econ-math/types";

export const ALPHA_FIELD: FieldSpec = {
  key: "alpha",
  label: t("Significance level (\u03b1)", "তাৎপর্য স্তর (\u03b1)"),
  help: t(
    "The probability of rejecting a true null hypothesis. 0.05 is common.",
    "সত্য শূন্য অনুমান প্রত্যাখ্যানের সম্ভাবনা। সাধারণত 0.05 ব্যবহার হয়।",
  ),
  defaultValue: "0.05",
  kind: "number",
};

export const TAILS_FIELD: FieldSpec = {
  key: "tails",
  label: t("Alternative hypothesis", "বিকল্প অনুমান"),
  defaultValue: "two-sided",
  kind: "select",
  options: [
    {
      value: "two-sided",
      label: t("Two-sided (\u2260)", "দ্বিমুখী (\u2260)"),
    },
    {
      value: "greater",
      label: t("Greater than (>)", "বড় (>)"),
    },
    {
      value: "less",
      label: t("Less than (<)", "ছোট (<)"),
    },
  ],
};

export const YES_NO_OPTIONS = [
  { value: "no", label: t("No", "না") },
  { value: "yes", label: t("Yes", "হ্যাঁ") },
];

export function decision(pValue: number, alpha: number): DecisionInfo {
  return { rejected: pValue < alpha, alpha, pValue };
}

export function decisionMetric(info: DecisionInfo): Metric {
  return {
    label: t("Decision", "সিদ্ধান্ত"),
    value: info.rejected
      ? t(
          `Reject H\u2080 at \u03b1 = ${formatNumber(info.alpha, 3)}`,
          `\u03b1 = ${formatNumber(info.alpha, 3)}-\u098f H\u2080 \u09aa\u09cd\u09b0\u09a4\u09cd\u09af\u09be\u0996\u09cd\u09af\u09be\u09a8 \u0995\u09b0\u09c1\u09a8`,
        )
      : t(
          `Fail to reject H\u2080 at \u03b1 = ${formatNumber(info.alpha, 3)}`,
          `\u03b1 = ${formatNumber(info.alpha, 3)}-\u098f H\u2080 \u09aa\u09cd\u09b0\u09a4\u09cd\u09af\u09be\u0996\u09cd\u09af\u09be\u09a8 \u0995\u09b0\u09be \u09af\u09be\u09df \u09a8\u09be`,
        ),
    tone: info.rejected ? "brand" : "warning",
  };
}

export function conclusion(info: DecisionInfo): BiText {
  const alpha = formatNumber(info.alpha, 3);
  const p = formatPValue(info.pValue);
  return info.rejected
    ? t(
        `Because p = ${p} is below \u03b1 = ${alpha}, the null hypothesis is rejected at the significance level you chose.`,
        `p = ${p}, \u03b1 = ${alpha} \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be \u099b\u09cb\u099f\u09cb, \u09a4\u09be\u0987 \u09a8\u09bf\u09b0\u09cd\u09ac\u09be\u099a\u09bf\u09a4 \u09a4\u09be\u09ce\u09aa\u09b0\u09cd\u09af \u09b8\u09cd\u09a4\u09b0\u09c7 \u09b6\u09c2\u09a8\u09cd\u09af \u0985\u09a8\u09c1\u09ae\u09be\u09a8 \u09aa\u09cd\u09b0\u09a4\u09cd\u09af\u09be\u0996\u09cd\u09af\u09be\u09a8 \u0995\u09b0\u09be \u09b9\u09df\u0964`,
      )
    : t(
        `Because p = ${p} is not below \u03b1 = ${alpha}, there is not enough evidence to reject the null hypothesis.`,
        `p = ${p}, \u03b1 = ${alpha} \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be \u099b\u09cb\u099f\u09cb \u09a8\u09df, \u09a4\u09be\u0987 \u09b6\u09c2\u09a8\u09cd\u09af \u0985\u09a8\u09c1\u09ae\u09be\u09a8 \u09aa\u09cd\u09b0\u09a4\u09cd\u09af\u09be\u0996\u09cd\u09af\u09be\u09a8\u09c7\u09b0 \u09aa\u09b0\u09cd\u09af\u09be\u09aa\u09cd\u09a4 \u09aa\u09cd\u09b0\u09ae\u09be\u09a3 \u09a8\u09c7\u0987\u0964`,
      );
}

export function pMetric(pValue: number): Metric {
  return {
    label: "p-value",
    value: formatPValue(pValue),
    tone: pValue < 0.05 ? "brand" : "default",
  };
}

export function ciMetric(
  interval: [number, number],
  digits = 3,
  label = t("95% confidence interval", "৯৫% আস্থা ব্যবধান"),
): Metric {
  return {
    label,
    value: `[${formatNumber(interval[0], digits)}, ${formatNumber(interval[1], digits)}]`,
  };
}

export function numberMetric(
  label: BiText,
  value: number,
  digits = 3,
  tone: Metric["tone"] = "default",
): Metric {
  return { label, value: formatNumber(value, digits), tone };
}

export function sampleSizeMetric(n: number): Metric {
  return { label: t("Sample size (n)", "নমুনার আকার (n)"), value: String(n) };
}

export function nullHypothesis(
  parameter: string,
  nullValue: string,
  tails: "two-sided" | "greater" | "less",
): string {
  if (tails === "greater") {
    return `H\u2080: ${parameter} \u2264 ${nullValue} ; H\u2081: ${parameter} > ${nullValue}`;
  }
  if (tails === "less") {
    return `H\u2080: ${parameter} \u2265 ${nullValue} ; H\u2081: ${parameter} < ${nullValue}`;
  }
  return `H\u2080: ${parameter} = ${nullValue} ; H\u2081: ${parameter} \u2260 ${nullValue}`;
}
