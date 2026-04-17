"use client";

import { Badge } from "@/components/ui/badge";
import type { Face } from "@/types";
import { cn } from "@/lib/utils";

interface FaceCardProps {
  face: Face;
  style?: React.CSSProperties;
  flipLeft?: boolean;
}

export function FaceCard({ face, style, flipLeft = false }: FaceCardProps) {
  const confidencePct = Math.round(face.confidence * 100);

  return (
    <div
      className={cn(
        "card-glass absolute top-0 w-60 rounded-2xl text-white shadow-2xl",
        "transition-all duration-500 ease-out",
        // Glow effect
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-[rgba(120,200,255,0.12)]",
        flipLeft
          ? "right-full mr-3 origin-right"
          : "left-full ml-3 origin-left"
      )}
      style={style}
    >
      {/* Connector tick mark pointing at the face */}
      <div
        className={cn(
          "absolute top-5 h-px w-3 bg-[rgba(120,200,255,0.4)]",
          flipLeft ? "right-0 translate-x-full" : "left-0 -translate-x-full"
        )}
      />
      <div
        className={cn(
          "absolute top-[18px] size-1.5 rounded-full bg-[rgba(120,200,255,0.55)]",
          flipLeft ? "right-[-18px]" : "left-[-18px]"
        )}
      />

      <div className="p-4">
        {/* Header row — name + relation badge */}
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-white">
              {face.name}
            </p>
            {face.lastSeen && (
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-white/35">
                Last seen {face.lastSeen}
              </p>
            )}
          </div>
          <Badge className="badge-relation mt-0.5 shrink-0">{face.relationship}</Badge>
        </div>

        {/* One-line memory note */}
        {face.note && (
          <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-white/55">
            {face.note}
          </p>
        )}

        {/* Confidence bar */}
        <div className="flex items-center gap-2.5">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${confidencePct}%`,
                background: `linear-gradient(90deg, rgba(120,200,255,0.3), rgba(120,200,255,0.8))`,
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-[rgba(120,200,255,0.75)]">
            {confidencePct}%
          </span>
        </div>
      </div>
    </div>
  );
}
