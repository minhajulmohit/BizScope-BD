"use client";

import { useState } from "react";
import type { AnalyticsData } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/components/language-provider";
import {
  EconomicPerformanceChart,
  TradeFlowsChart,
} from "@/components/charts/overview-charts";

const COPY = {
  en: {
    label: "Choose a chart",
    economic: "Growth & inflation",
    trade: "Trade flows",
  },
  bn: {
    label: "চার্ট বাছুন",
    economic: "প্রবৃদ্ধি ও মূল্যস্ফীতি",
    trade: "বাণিজ্য প্রবাহ",
  },
};

type View = "economic" | "trade";

export function OverviewChartSwitcher({
  analytics,
  inBdt,
}: {
  analytics: AnalyticsData;
  inBdt: boolean;
}) {
  const language = useLanguage();
  const copy = COPY[language];
  const [view, setView] = useState<View>("economic");

  const options: Array<{ key: View; label: string }> = [
    { key: "economic", label: copy.economic },
    { key: "trade", label: copy.trade },
  ];

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={copy.label}
        className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-muted/60 p-1"
      >
        {options.map((option) => {
          const active = view === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setView(option.key)}
              aria-pressed={active}
              className={cn(
                "rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {view === "economic" ? (
        <EconomicPerformanceChart analytics={analytics} />
      ) : (
        <TradeFlowsChart analytics={analytics} inBdt={inBdt} />
      )}
    </div>
  );
}
