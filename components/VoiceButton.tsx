"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMimirStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Waveform bar heights (animation-delay steps)
const WAVE_DELAYS = ["0s", "0.1s", "0.2s", "0.1s", "0s"];

interface VoiceButtonProps {
  currentPersonId?: string;
}

export function VoiceButton({ currentPersonId }: VoiceButtonProps) {
  const [transcript, setTranscript] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isListening = useMimirStore((s) => s.isListening);
  const lastVoiceResponse = useMimirStore((s) => s.lastVoiceResponse);
  const { setIsListening, setLastVoiceResponse } = useMimirStore();

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const showResponse = useCallback(
    (response: string) => {
      setLastVoiceResponse(response);
      setShowTooltip(true);
      speak(response);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = setTimeout(() => {
        setShowTooltip(false);
        setLastVoiceResponse(null);
      }, 4000);
    },
    [setLastVoiceResponse, speak]
  );

  const sendQuery = useCallback(
    async (query: string) => {
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, currentPersonId }),
        });
        const data = await res.json();
        if (data.response) showResponse(data.response);
      } catch {
        showResponse("Sorry, I couldn't connect to the server.");
      }
    },
    [currentPersonId, showResponse]
  );

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as unknown as Window).SpeechRecognition ??
      (window as unknown as Window).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      showResponse("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      sendQuery(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [setIsListening, sendQuery, showResponse]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [setIsListening]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3">
      {/* Response tooltip */}
      {showTooltip && lastVoiceResponse && (
        <Card className="card-glass max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="px-4 py-3">
            <p className="text-xs leading-relaxed text-white/80">{lastVoiceResponse}</p>
            {transcript && (
              <p className="mt-1 font-mono text-[10px] text-white/35">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Waveform bars */}
      {isListening && (
        <div className="flex items-end gap-0.5 h-6">
          {WAVE_DELAYS.map((delay, i) => (
            <div
              key={i}
              className="wave-bar w-1 rounded-full bg-[rgba(120,200,255,0.75)]"
              style={{
                height: "24px",
                animationDelay: delay,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>
      )}

      {/* Mic button */}
      <Button
        size="icon"
        onClick={handleClick}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
        className={cn(
          "btn-glass size-14 rounded-full transition-all duration-200",
          isListening && "pulse-ring border-[rgba(120,200,255,0.5)]"
        )}
      >
        {isListening ? (
          /* Stop icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 text-[rgba(120,200,255,0.9)]"
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
    </div>
  );
}
