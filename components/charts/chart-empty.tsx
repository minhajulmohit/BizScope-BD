"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { EmptyState } from "@/components/ui/states";

const COPY = {
  en: {
    title: "No chart data available",
    description:
      "The source did not return usable observations for this series. Missing values are not interpolated.",
  },
  bn: {
    title: "চার্টের জন্য ডেটা নেই",
    description:
      "এই সিরিজের জন্য উৎস থেকে ব্যবহারযোগ্য কোনো পর্যবেক্ষণ পাওয়া যায়নি। অনুপস্থিত মান অনুমান করে পূরণ করা হয়নি।",
  },
};

export function ChartEmpty({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const copy = COPY[useLanguage()];

  return (
    <EmptyState
      icon={ChartNoAxesCombined}
      title={title ?? copy.title}
      description={description ?? copy.description}
      className="py-12"
    />
  );
}
