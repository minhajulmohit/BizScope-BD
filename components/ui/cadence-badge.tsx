import { CalendarRange, Clock3, Database, Landmark } from "lucide-react";
import type { DataCadence } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const CADENCE_CONFIG: Record<
  DataCadence,
  { tone: BadgeTone; icon: typeof Clock3; fallback: string }
> = {
  daily: { tone: "blue", icon: Clock3, fallback: "Daily reference" },
  periodic: { tone: "neutral", icon: CalendarRange, fallback: "Periodic statistics" },
  catalog: { tone: "amber", icon: Database, fallback: "Catalog" },
  manual: { tone: "outline", icon: Landmark, fallback: "Manual access" },
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
  const config = CADENCE_CONFIG[cadence];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={cn("normal-case tracking-normal", className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{label ?? config.fallback}</span>
    </Badge>
  );
}
