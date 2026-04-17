"use client";

import { Badge } from "@/components/ui/badge";
import { useMimirStore } from "@/lib/store";
import type { WsStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<WsStatus, string> = {
  open: "LIVE",
  connecting: "CONNECTING",
  closed: "OFFLINE",
};

const PULSE_COLORS: Record<WsStatus, string> = {
  open: "bg-emerald-400",
  connecting: "bg-amber-400",
  closed: "bg-red-500",
};

export function StatusPill() {
  const wsStatus = useMimirStore((s) => s.wsStatus);

  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] tracking-widest text-white/70 backdrop-blur-md"
    >
      <span
        className={cn(
          "inline-block size-1.5 rounded-full",
          PULSE_COLORS[wsStatus],
          wsStatus === "open" && "animate-pulse"
        )}
      />
      {STATUS_LABELS[wsStatus]}
    </Badge>
  );
}
