"use client";

import { CalendarRange, Clock3, Database, Landmark } from "lucide-react";
import type { DataCadence } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useUiCopy } from "@/components/language-provider";

const CADENCE_CONFIG: Record<
  DataCadence,
  { tone: BadgeTone; icon: typeof Clock3; fallback: "daily" | "periodic" | "catalog" | "manual" }
> = {
  daily: { tone: "blue", icon: Clock3, fallback: "daily" },
  periodic: { tone: "neutral", icon: CalendarRange, fallback: "periodic" },
  catalog: { tone: "amber", icon: Database, fallback: "catalog" },
  manual: { tone: "outline", icon: Landmark, fallback: "manual" },
};

export function CadenceBadge({
  cadence,
  label,
  className,
}: {
  cadence: DataCadence;
  label?: string;
  className?: string;
}) {
  const copy = useUiCopy();
  const config = CADENCE_CONFIG[cadence];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={cn("normal-case tracking-normal", className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{label ?? copy.cadence[config.fallback]}</span>
    </Badge>
  );
}
