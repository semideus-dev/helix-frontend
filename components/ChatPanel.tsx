"use client";

import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatChatTime } from "@/lib/formatTime";
import { useMimirStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";

const WAVE_DELAYS = ["0ms", "90ms", "180ms", "270ms", "360ms", "450ms", "540ms"];

export function ChatPanel() {
  const { isOpen, messages, isThinking, closeChat } = useChatStore();
  const interimText = useMimirStore((s) => s.interimVoiceText);
  const voiceStatus = useMimirStore((s) => s.voiceStatus);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const waveformActive = voiceStatus === "listening" || voiceStatus === "speaking";

  const footerText = useMemo(() => {
    const text = interimText.trim();
    if (!text) return "Listening...";
    return text.slice(0, 200);
  }, [interimText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isOpen]);

  return (
    <div
      className={cn(
        "chat-panel fixed top-4 right-6 bottom-4 z-[60] flex w-[340px] flex-col rounded-2xl",
        isOpen ? "chat-panel--open" : "chat-panel--closed"
      )}
      aria-hidden={!isOpen}
    >
      <header className="flex items-start justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-white/80">Memory Assistant</p>
          <Badge
            variant="outline"
            className="border-[rgba(60,220,120,0.45)] bg-[rgba(30,120,70,0.15)] px-2 font-mono text-[10px] tracking-[0.16em] text-[rgba(60,220,120,0.8)]"
          >
            <span className="chat-live-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[rgba(60,220,120,0.9)]" />
            LIVE
          </Badge>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
            onClick={closeChat}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
          <p className="font-mono text-[10px] leading-none text-white/24">or say &apos;close chat&apos;</p>
        </div>
      </header>

      <div className="chat-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <article
              key={message.id}
              className={cn("chat-message-enter flex flex-col gap-1", isUser ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "px-3.25 py-2.25 text-[13px] leading-relaxed",
                  isUser
                    ? "max-w-[78%] rounded-[14px_14px_4px_14px] border border-[rgba(120,200,255,0.2)] bg-[rgba(120,200,255,0.12)] text-white/88"
                    : "max-w-[85%] rounded-[14px_14px_14px_4px] border border-white/8 bg-white/5 text-white/75"
                )}
              >
                {message.text}
              </div>
              <p className={cn("font-mono text-[10px] text-white/28", isUser ? "text-right" : "text-left")}>
                {formatChatTime(message.timestamp)}
              </p>
            </article>
          );
        })}

        {isThinking && (
          <div className="chat-message-enter flex items-start">
            <div className="flex items-center gap-1 rounded-[14px_14px_14px_4px] border border-white/8 bg-white/5 px-3 py-2">
              <span className="chat-thinking-dot h-1 w-1 rounded-full bg-[rgba(120,200,255,0.6)]" />
              <span className="chat-thinking-dot h-1 w-1 rounded-full bg-[rgba(120,200,255,0.6)] [animation-delay:200ms]" />
              <span className="chat-thinking-dot h-1 w-1 rounded-full bg-[rgba(120,200,255,0.6)] [animation-delay:400ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-white/8 px-4 py-3">
        <div className="flex h-7 items-end justify-center gap-1.5">
          {WAVE_DELAYS.map((delay) => (
            <span
              key={delay}
              className={cn(
                "h-6 w-1.5 rounded-full bg-[rgba(120,200,255,0.55)]",
                waveformActive ? "chat-wave-bar" : "opacity-45"
              )}
              style={{
                animationDelay: delay,
                height: waveformActive ? "24px" : "4px",
                transition: "height 0.2s ease",
              }}
            />
          ))}
        </div>
        <p className="truncate text-center text-[12px] italic text-white/45">{footerText}</p>
        <p className="text-center font-mono text-[10px] text-white/22">say &apos;close chat&apos; to dismiss</p>
      </footer>
    </div>
  );
}
