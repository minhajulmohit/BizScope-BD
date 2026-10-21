import { ChartNoAxesCombined } from "lucide-react";
import { EmptyState } from "@/components/ui/states";

export function ChartEmpty({
  title = "No chart data available",
  description = "The source did not return usable observations for this series. Missing values are not interpolated.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={ChartNoAxesCombined}
      title={title}
      description={description}
      className="py-12"
    />
  );
}
