"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMimirStore } from "@/lib/store";
import { getMockResponse } from "@/lib/mockChatResponses";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { TranscriptSegment, VoiceSessionPayload, VoiceStatus } from "@/types/voice";

export const SILENCE_TIMEOUT_MS = 3000;
const NETWORK_RETRY_DELAY_MS = 750;
const MAX_NETWORK_RETRIES = 3;
const CHAT_TRIGGER = "open chat";
const CLOSE_TRIGGER = "close chat";
const CHAT_TRIGGER_REGEX = /open chat/gi;
const CLOSE_TRIGGER_REGEX = /close chat/gi;

// ---------------------------------------------------------------------------
// Stub dispatcher — swap with real fetch when API is ready
// ---------------------------------------------------------------------------
async function dispatchSession(payload: VoiceSessionPayload) {
  void payload;
  // TODO: replace with real fetch when API is ready
  // await fetch('/api/voice/session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  console.log("🚀 dispatchSession called — API not yet wired");
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useVoiceRecorder() {
  // ── Reactive state (drives rendering) ─────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== "undefined" &&
      !!((window as Window).SpeechRecognition ||
        (window as Window).webkitSpeechRecognition)
  );
  const [status, setStatusState] = useState<VoiceStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalSegments, setFinalSegments] = useState<TranscriptSegment[]>([]);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Refs (read inside callbacks without stale-closure risk) ───────────────
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const networkRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<string>("");
  const utteranceIndexRef = useRef<number>(0);
  const lastActivityAtRef = useRef<number>(0);
  const isSessionActiveRef = useRef<boolean>(false);
  const finalSegmentsRef = useRef<TranscriptSegment[]>([]);
  const interimTextRef = useRef<string>("");
  const statusRef = useRef<VoiceStatus>("idle");
  const networkRetryCountRef = useRef<number>(0);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const logVoice = useCallback((event: string, details?: unknown) => {
    if (details !== undefined) {
      console.log(`🎙️ [voice] ${event}`, details);
      return;
    }
    console.log(`🎙️ [voice] ${event}`);
  }, []);

  const updateStatus = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setStatusState(s);
    useMimirStore.getState().setVoiceStatus(s);
    logVoice(`status -> ${s}`);
  }, [logVoice]);

  const setInterim = useCallback((value: string) => {
    interimTextRef.current = value;
    setInterimText(value);
    useMimirStore.getState().setInterimVoiceText(value);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
    if (networkRetryTimerRef.current !== null) clearTimeout(networkRetryTimerRef.current);
    silenceTimerRef.current = null;
    countdownIntervalRef.current = null;
    networkRetryTimerRef.current = null;
    setSilenceCountdown(null);
    setInterim("");
    setIsListening(false);
    updateStatus("idle");
    finalSegmentsRef.current = [];
    setFinalSegments([]);
    utteranceIndexRef.current = 0;
    sessionIdRef.current = null;
    startedAtRef.current = "";
    sessionStartRef.current = 0;
    networkRetryCountRef.current = 0;
    useMimirStore.getState().setInterimVoiceText("");
  }, [setInterim, updateStatus]);

  // ── Session assembly ──────────────────────────────────────────────────────
  const assembleSession = useCallback(
    (endReason: "manual" | "silence_timeout") => {
      const segs = finalSegmentsRef.current.filter((s) => s.isFinal);

      if (segs.length === 0) {
        // Zero-word session — skip dispatch, just reset
        cleanup();
        return;
      }

      const endedAt = new Date().toISOString();
      const durationSeconds = Math.round(
        (Date.now() - sessionStartRef.current) / 1000
      );
      const fullText = segs.map((s) => s.text).join(" ");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      const userId = useAuthStore.getState().userId;
      const activeFaces = useMimirStore.getState().activeFaces;
      const firstFace = activeFaces[0] ?? null;

      const payload: VoiceSessionPayload = {
        sessionId: sessionIdRef.current ?? crypto.randomUUID(),
        userId,
        startedAt: startedAtRef.current,
        endedAt,
        durationSeconds,
        endReason,
        transcript: segs,
        fullText,
        wordCount,
        activeFaceId: firstFace?.id ?? null,
        activeFaceName: firstFace?.name ?? null,
      };

      console.log(
        "📋 Voice session payload:",
        JSON.stringify(payload, null, 2)
      );
      useMimirStore.getState().setLastSession(payload);
      dispatchSession(payload);
      cleanup();
    },
    [cleanup]
  );

  // ── Auto-stop (silence timeout fires) ────────────────────────────────────
  const handleAutoStop = useCallback(() => {
    if (useChatStore.getState().isOpen) return;
    logVoice("auto-stop triggered");
    isSessionActiveRef.current = false;
    recognitionRef.current?.stop();
    if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
    silenceTimerRef.current = null;
    countdownIntervalRef.current = null;
    setSilenceCountdown(null);
    updateStatus("processing");
    setIsListening(false);
    assembleSession("silence_timeout");
  }, [assembleSession, logVoice, updateStatus]);

  // ── Silence timer reset (call on every speech result) ────────────────────
  const resetSilenceTimer = useCallback(() => {
    const chatOpen = useChatStore.getState().isOpen;
    if (chatOpen) return;
    if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);

    const start = Date.now();
    silenceTimerRef.current = setTimeout(handleAutoStop, SILENCE_TIMEOUT_MS);

    // Countdown display interval
    setSilenceCountdown(Math.ceil(SILENCE_TIMEOUT_MS / 1000));
    countdownIntervalRef.current = setInterval(() => {
      const remaining = SILENCE_TIMEOUT_MS - (Date.now() - start);
      if (remaining <= 0) {
        if (countdownIntervalRef.current !== null)
          clearInterval(countdownIntervalRef.current);
        setSilenceCountdown(null);
      } else {
        setSilenceCountdown(Math.ceil(remaining / 1000));
        // Transition to 'silence' status when no recent speech
        if (
          (statusRef.current === "speaking" || statusRef.current === "listening") &&
          Date.now() - lastActivityAtRef.current > 1200
        ) {
          updateStatus("silence");
        }
      }
    }, 500);
  }, [handleAutoStop, updateStatus]);

  // ── Stop session (manual) ─────────────────────────────────────────────────
  const stopSession = useCallback(() => {
    if (!isSessionActiveRef.current) return;
    if (statusRef.current === "processing") return;
    logVoice("manual stop triggered");
    isSessionActiveRef.current = false;
    recognitionRef.current?.stop();
    if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
    silenceTimerRef.current = null;
    countdownIntervalRef.current = null;
    setSilenceCountdown(null);
    setIsListening(false);
    assembleSession("manual");
  }, [assembleSession, logVoice]);

  // ── Start session ─────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    if (isSessionActiveRef.current) return;
    if (statusRef.current === "processing") return;

    const SpeechRecognition =
      (window as Window).SpeechRecognition ||
      (window as Window).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      toast.error(
        "Voice input not supported in this browser. Use Chrome or Edge."
      );
      return;
    }

    // Reset state for new session
    finalSegmentsRef.current = [];
    setFinalSegments([]);
    utteranceIndexRef.current = 0;
    setInterim("");
    setError(null);

    sessionStartRef.current = Date.now();
    sessionIdRef.current = crypto.randomUUID();
    startedAtRef.current = new Date().toISOString();
    lastActivityAtRef.current = Date.now();
    networkRetryCountRef.current = 0;
    logVoice("session started", {
      sessionId: sessionIdRef.current,
      startedAt: startedAtRef.current,
    });

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      lastActivityAtRef.current = Date.now();
      networkRetryCountRef.current = 0;

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence = result[0].confidence ?? 0;

        if (result.isFinal) {
          const trimmed = text.trim();
          if (!trimmed) continue;
          const segment: TranscriptSegment = {
            index: utteranceIndexRef.current++,
            text: trimmed,
            isFinal: true,
            confidence,
            timestamp: new Date().toISOString(),
          };
          let segmentText = segment.text;
          const clean = segmentText.toLowerCase().trim();

          if (clean.includes(CHAT_TRIGGER)) {
            useChatStore.getState().openChat();
            segmentText = segmentText.replace(CHAT_TRIGGER_REGEX, "").trim();
          }

          if (useChatStore.getState().isOpen && clean.includes(CLOSE_TRIGGER)) {
            useChatStore.getState().closeChat();
            segmentText = segmentText.replace(CLOSE_TRIGGER_REGEX, "").trim();
          }

          segment.text = segmentText;
          if (!segment.text) continue;

          const chatOpen = useChatStore.getState().isOpen;
          if (chatOpen) {
            useChatStore.getState().addMessage("user", segment.text);
            useChatStore.getState().setThinking(true);
            setTimeout(() => {
              useChatStore.getState().addMessage("assistant", getMockResponse(segment.text));
              useChatStore.getState().setThinking(false);
            }, 1200 + Math.random() * 800);
            logVoice("chat segment", segment);
          } else {
            finalSegmentsRef.current = [...finalSegmentsRef.current, segment];
            setFinalSegments([...finalSegmentsRef.current]);
            logVoice("final segment", segment);
          }
        } else {
          interim += text;
        }
      }

      setInterim(interim);
      updateStatus("speaking");
      resetSilenceTimer();
    };

    recognition.onaudiostart = () => {
      lastActivityAtRef.current = Date.now();
      networkRetryCountRef.current = 0;
      resetSilenceTimer();
    };

    recognition.onsoundstart = () => {
      lastActivityAtRef.current = Date.now();
      updateStatus("speaking");
      resetSilenceTimer();
    };

    recognition.onspeechstart = () => {
      lastActivityAtRef.current = Date.now();
      updateStatus("speaking");
      resetSilenceTimer();
    };

    recognition.onspeechend = () => {
      if (isSessionActiveRef.current && statusRef.current !== "processing") {
        updateStatus("silence");
      }
    };

    recognition.onend = () => {
      // Chrome stops recognition after ~60s — restart if session is still active
      logVoice("recognition ended");
      if (isSessionActiveRef.current) {
        try {
          updateStatus("listening");
          recognition.start();
          logVoice("recognition restarted");
        } catch {
          // Ignore errors during restart (e.g. if stop was just called)
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = event.error;
      logVoice("recognition error", { error: err, message: event.message });
      if (err === "not-allowed") {
        setError("Microphone access denied. Check browser permissions.");
        toast.error("Microphone access denied. Check browser permissions.");
        isSessionActiveRef.current = false;
        recognitionRef.current?.abort();
        if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
        if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
        silenceTimerRef.current = null;
        countdownIntervalRef.current = null;
        updateStatus("idle");
        setIsListening(false);
      } else if (err === "audio-capture") {
        setError("Audio capture failed. Check your microphone.");
        toast.error("Audio capture failed. Check your microphone.");
        isSessionActiveRef.current = false;
        recognitionRef.current?.abort();
        if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
        if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
        silenceTimerRef.current = null;
        countdownIntervalRef.current = null;
        updateStatus("idle");
        setIsListening(false);
      } else if (err === "network") {
        if (!isSessionActiveRef.current) return;

        const isOffline =
          typeof navigator !== "undefined" && navigator.onLine === false;

        if (isOffline) {
          setError("No internet connection. Speech recognition needs network access.");
          toast.error("No internet connection. Check your network and try again.");
          updateStatus("silence");
          return;
        }

        networkRetryCountRef.current += 1;
        const attempt = networkRetryCountRef.current;
        setError(`Speech service network issue. Retrying (${attempt}/${MAX_NETWORK_RETRIES})...`);
        updateStatus("listening");
        lastActivityAtRef.current = Date.now();
        resetSilenceTimer();

        if (attempt > MAX_NETWORK_RETRIES) {
          toast.error("Speech recognition network error. Please try again.");
          isSessionActiveRef.current = false;
          recognitionRef.current?.abort();
          if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
          if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
          if (networkRetryTimerRef.current !== null) clearTimeout(networkRetryTimerRef.current);
          silenceTimerRef.current = null;
          countdownIntervalRef.current = null;
          networkRetryTimerRef.current = null;
          updateStatus("idle");
          setIsListening(false);
          return;
        }

        if (networkRetryTimerRef.current !== null) clearTimeout(networkRetryTimerRef.current);
        networkRetryTimerRef.current = setTimeout(() => {
          if (!isSessionActiveRef.current) return;
          try {
            recognition.stop();
          } catch {
            // no-op
          }
          try {
            recognition.start();
            logVoice("recognition retry start", { attempt });
          } catch {
            logVoice("recognition retry failed to start", { attempt });
          }
        }, NETWORK_RETRY_DELAY_MS);
      }
      // 'no-speech': treat as silence — let the silence timer handle shutdown
    };

    recognitionRef.current = recognition;
    isSessionActiveRef.current = true;

    updateStatus("listening");
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      toast.error("Could not start microphone. Try again.");
      isSessionActiveRef.current = false;
      updateStatus("idle");
      setIsListening(false);
      return;
    }
    // Start silence timer immediately (handles case: user activates mic but says nothing)
    resetSilenceTimer();
  }, [logVoice, resetSilenceTimer, setInterim, updateStatus]);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggleSession = useCallback(() => {
    if (statusRef.current === "processing") return;
    if (isSessionActiveRef.current) {
      stopSession();
    } else {
      startSession();
    }
  }, [startSession, stopSession]);

  // ── Tab visibility — stop session if tab is hidden ────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSessionActiveRef.current) {
        stopSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopSession]);

  // ── Unmount cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      if (!prevState.isOpen && state.isOpen) {
        if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
        if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
        silenceTimerRef.current = null;
        countdownIntervalRef.current = null;
        setSilenceCountdown(null);
      }

      if (prevState.isOpen && !state.isOpen && isSessionActiveRef.current) {
        resetSilenceTimer();
      }
    });

    return () => {
      unsubscribe();
      isSessionActiveRef.current = false;
      recognitionRef.current?.stop();
      if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current !== null) clearInterval(countdownIntervalRef.current);
      if (networkRetryTimerRef.current !== null) clearTimeout(networkRetryTimerRef.current);
    };
  }, [resetSilenceTimer]);

  return {
    isListening,
    isSupported,
    status,
    interimText,
    finalSegments,
    silenceCountdown,
    error,
    startSession,
    stopSession,
    toggleSession,
  };
}
