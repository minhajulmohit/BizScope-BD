import { formatRate, formatUtcDate } from "@/lib/utils/format";
import { DataNotice } from "@/components/ui/data-notice";

export function BdtConversionNotice({
  bdtPerUsd,
  updatedAt,
  className,
}: {
  bdtPerUsd: number | null;
  updatedAt: string | null;
  className?: string;
}) {
  if (bdtPerUsd === null || !Number.isFinite(bdtPerUsd) || bdtPerUsd <= 0) {
    return (
      <DataNotice
        tone="warning"
        title="Taka conversion is temporarily unavailable."
        className={className}
      >
        The daily reference rate could not be loaded, so World Bank money values
        are shown in their original US dollars. The observation years and source
        links are unchanged.
      </DataNotice>
    );
  }

  return (
    <DataNotice title="Taka values use today's reference rate." className={className}>
      The World Bank publishes GDP and trade in US dollars. BizScope converts them
      at <span className="font-medium text-foreground-soft">1 USD = ৳{formatRate(bdtPerUsd)}</span>{" "}
      from the {formatUtcDate(updatedAt)} reference update. The same current rate
      is applied to every year, so these are BDT equivalents — not historical
      exchange-rate conversions. Observation years still refer to the World Bank
      data.
    </DataNotice>
  );
}
