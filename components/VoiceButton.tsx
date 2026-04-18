"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMimirStore } from "@/lib/store";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { VoiceStatus } from "@/types/voice";

const WAVE_DELAYS = ["0s", "0.1s", "0.2s", "0.1s", "0s"];

interface VoiceButtonProps {
  currentPersonId?: string;
}

// Map status → border colour class (applied via inline style to avoid Tailwind purge)
function borderForStatus(status: VoiceStatus): string {
  if (status === "listening" || status === "speaking") return "rgba(120,200,255,0.35)";
  if (status === "silence") return "rgba(255,180,60,0.5)";
  return "transparent";
}

export function VoiceButton({ currentPersonId: _currentPersonId }: VoiceButtonProps) {
  void _currentPersonId;
  const {
    isListening,
    isSupported,
    status,
    interimText,
    silenceCountdown,
    toggleSession,
    stopSession,
  } = useVoiceRecorder();
  const { isOpen: chatOpen, closeChat } = useChatStore();

  const lastSession = useMimirStore((s) => s.lastSession);

  // Track prev status to detect session-end transition
  const prevStatusRef = useRef<VoiceStatus>("idle");
  const [summary, setSummary] = useState<{ utterances: number; words: number } | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let immediateTimer: ReturnType<typeof setTimeout> | null = null;
    if (prevStatusRef.current === "processing" && status === "idle") {
      if (lastSession && lastSession.wordCount > 0) {
        const nextSummary = {
          utterances: lastSession.transcript.length,
          words: lastSession.wordCount,
        };
        immediateTimer = setTimeout(() => {
          setSummary(nextSummary);
          if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
          summaryTimerRef.current = setTimeout(() => setSummary(null), 3000);
        }, 0);
      }
    }
    prevStatusRef.current = status;
    return () => {
      if (immediateTimer) clearTimeout(immediateTimer);
    };
  }, [status, lastSession]);

  useEffect(() => {
    return () => {
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    };
  }, []);

  const showTooltip = !chatOpen && (status !== "idle" || summary !== null);

  // Waveform freezes during silence / processing
  const waveformActive = status === "listening" || status === "speaking";

  const tooltipText = (() => {
    if (summary) return `Recorded ${summary.utterances} utterance${summary.utterances !== 1 ? "s" : ""} · ${summary.words} words`;
    if (status === "processing") return "Saving session...";
    if (status === "silence") return `Stopping in ${silenceCountdown ?? 0}s...`;
    if (status === "speaking" && interimText) return interimText.slice(0, 120);
    if (status === "speaking") return "Speech detected...";
    if (status === "listening") return "Listening...";
    return null;
  })();

  const tooltipAmber = status === "silence";
  const handleButtonClick = () => {
    if (chatOpen) {
      closeChat();
      stopSession();
      return;
    }
    toggleSession();
  };

  return (
    <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3">
      {/* Tooltip card */}
      {showTooltip && tooltipText && (
        <Card className="card-glass max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="px-4 py-3">
            <p
              className={cn(
                "text-xs leading-relaxed",
                tooltipAmber ? "text-amber-400" : "text-white/80"
              )}
            >
              {tooltipText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Waveform bars */}
      {isListening && (
        <div className="flex items-end gap-0.5 h-6">
          {WAVE_DELAYS.map((delay, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full",
                waveformActive
                  ? "wave-bar bg-[rgba(120,200,255,0.75)]"
                  : "bg-[rgba(120,200,255,0.4)]"
              )}
              style={{
                height: waveformActive ? "24px" : "3px",
                animationDelay: delay,
                transformOrigin: "bottom",
                transition: "height 0.2s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Mic button */}
      <Button
        size="icon"
        onClick={handleButtonClick}
        disabled={!isSupported || status === "processing"}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
        className={cn(
          "btn-glass size-14 rounded-full transition-all duration-200",
          (status === "listening" || status === "speaking") && "pulse-ring",
          status === "silence" && "border-[rgba(255,180,60,0.5)]"
        )}
        style={{
          borderColor: chatOpen ? "rgba(60,220,120,0.5)" : borderForStatus(status),
        }}
      >
        {status === "processing" ? (
          /* Spinner */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-5 animate-spin text-white/60"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : isListening ? (
          /* Stop icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn(
              "size-5",
              status === "silence"
                ? "text-amber-400"
                : "text-[rgba(120,200,255,0.9)]"
            )}
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          /* Mic icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 text-white/70"
          >
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Z" />
            <path d="M19 10a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 10Z" />
          </svg>
        )}
      </Button>

      {/* Unsupported browser notice */}
      {!isSupported && (
        <p className="text-[10px] text-white/40">
          Voice not supported in this browser
        </p>
      )}
    </div>
  );
}
