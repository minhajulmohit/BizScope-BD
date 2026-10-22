import { t, type CategoryId } from "@/lib/econ-math/types";

export interface CategoryMeta {
  id: CategoryId;
  label: { en: string; bn: string };
  shortLabel: { en: string; bn: string };
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "descriptive",
    label: t("Descriptive statistics", "বর্ণনামূলক পরিসংখ্যান"),
    shortLabel: t("Descriptive", "বর্ণনামূলক"),
  },
  {
    id: "hypothesis",
    label: t("Hypothesis tests", "অনুমান পরীক্ষা"),
    shortLabel: t("Hypothesis", "অনুমান"),
  },
  {
    id: "regression",
    label: t("Correlation & regression", "সম্পর্ক ও রিগ্রেশন"),
    shortLabel: t("Regression", "রিগ্রেশন"),
  },
  {
    id: "micro",
    label: t("Microeconomics", "অণুঅর্থনীতি"),
    shortLabel: t("Micro", "অণু"),
  },
  {
    id: "macro",
    label: t("Macroeconomics", "সমষ্টি অর্থনীতি"),
    shortLabel: t("Macro", "সমষ্টি"),
  },
  {
    id: "finance",
    label: t("Business finance", "ব্যবসায়িক অর্থায়ন"),
    shortLabel: t("Finance", "অর্থায়ন"),
  },
  {
    id: "index",
    label: t("Index numbers", "সূচক সংখ্যা"),
    shortLabel: t("Index", "সূচক"),
  },
];
