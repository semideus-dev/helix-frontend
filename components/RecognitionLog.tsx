"use client";

import { useMimirStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RecognitionLog() {
  const recognitionLog = useMimirStore((s) => s.recognitionLog);

  return (
    <div className="card-glass overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 px-5 py-3">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/50">
          Recognition Log
        </h2>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {recognitionLog.length === 0 ? (
          <p className="px-5 py-8 text-center font-mono text-[11px] text-white/25">
            No recognitions yet
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
                  Person
                </th>
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
                  Time
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10px] uppercase tracking-widest text-white/30">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {recognitionLog.map((entry, i) => {
                const ts = new Date(entry.timestamp);
                const timeStr = ts.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                const confidencePct = Math.round(entry.confidence * 100);

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-white/5 transition-colors hover:bg-white/3",
                      i === 0 && "bg-[rgba(120,200,255,0.04)]"
                    )}
                  >
                    <td className="px-5 py-2.5">
                      <div className="text-xs font-medium text-white/80">
                        {entry.personName}
                      </div>
                      <div className="font-mono text-[10px] text-white/35">
                        {entry.relationship}
                      </div>
                    </td>
                    <td className="px-5 py-2.5 font-mono text-[11px] text-white/45">
                      {timeStr}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-[11px] text-[rgba(120,200,255,0.7)]">
                      {confidencePct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
