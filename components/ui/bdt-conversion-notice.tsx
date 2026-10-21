import { formatRate, formatUtcDate } from "@/lib/utils/format";
import type { Language } from "@/lib/i18n";
import { DataNotice } from "@/components/ui/data-notice";

const COPY = {
  en: {
    unavailableTitle: "Taka conversion is temporarily unavailable.",
    unavailable:
      "The daily reference rate could not be loaded, so World Bank money values are shown in their original US dollars. The observation years and source links are unchanged.",
    title: "Taka values use today's reference rate.",
    bodyStart:
      "The World Bank publishes GDP and trade in US dollars. BizScope converts them at",
    bodyMiddle: "from the",
    bodyEnd:
      "reference update. These are present-day BDT equivalents, not historical exchange-rate conversions, and they are not adjusted for inflation.",
    updated: "reference update",
  },
  bn: {
    unavailableTitle: "টাকায় রূপান্তর সাময়িকভাবে পাওয়া যাচ্ছে না।",
    unavailable:
      "দৈনিক রেফারেন্স হার লোড করা যায়নি, তাই বিশ্বব্যাংকের অর্থসংক্রান্ত মান মূল মার্কিন ডলারেই দেখানো হচ্ছে। পর্যবেক্ষণের বছর ও উৎসের লিংক অপরিবর্তিত আছে।",
    title: "টাকার মান আজকের রেফারেন্স হার ব্যবহার করে।",
    bodyStart:
      "বিশ্বব্যাংক জিডিপি ও বাণিজ্যের মান মার্কিন ডলারে প্রকাশ করে। BizScope সেগুলো রূপান্তর করে",
    bodyMiddle: "হারে, যা",
    bodyEnd:
      "রেফারেন্স আপডেট থেকে নেওয়া। এগুলো আজকের টাকার সমতুল্য—ঐতিহাসিক বিনিময় হারের রূপান্তর নয়, এবং মূল্যস্ফীতির সঙ্গে সমন্বয় করা নয়।",
    updated: "রেফারেন্স আপডেট",
  },
};

export function BdtConversionNotice({
  bdtPerUsd,
  updatedAt,
  language,
  className,
}: {
  bdtPerUsd: number | null;
  updatedAt: string | null;
  language: Language;
  className?: string;
}) {
  const copy = COPY[language];

  if (bdtPerUsd === null || !Number.isFinite(bdtPerUsd) || bdtPerUsd <= 0) {
    return (
      <DataNotice tone="warning" title={copy.unavailableTitle} className={className}>
        {copy.unavailable}
      </DataNotice>
    );
  }

  return (
    <DataNotice title={copy.title} className={className}>
      {copy.bodyStart}{" "}
      <span className="font-medium text-foreground-soft">
        1 USD = ৳{formatRate(bdtPerUsd)}
      </span>{" "}
      {copy.bodyMiddle} {formatUtcDate(updatedAt)} {copy.bodyEnd}
    </DataNotice>
  );
}
