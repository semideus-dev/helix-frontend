"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FaceOverlay } from "@/components/FaceOverlay";
import { VoiceButton } from "@/components/VoiceButton";
import { StatusPill } from "@/components/StatusPill";
import { SignOutButton } from "@/components/SignOutButton";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMimirStore } from "@/lib/store";
import { MOCK_FACES, MOCK_PEOPLE } from "@/lib/mockData";

export default function ARPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [dimensions, setDimensions] = useState({
    videoWidth: 1280,
    videoHeight: 720,
    containerWidth: typeof window !== "undefined" ? window.innerWidth : 1280,
    containerHeight: typeof window !== "undefined" ? window.innerHeight : 720,
  });

  const activeFaces = useMimirStore((s) => s.activeFaces);
  const wsStatus = useMimirStore((s) => s.wsStatus);
  const { setActiveFaces, setEnrolledPeople } = useMimirStore();
  const primaryFaceId = activeFaces[0]?.id;

  // Seed mock data on load so cards are visible immediately
  useEffect(() => {
    setEnrolledPeople(MOCK_PEOPLE);
  }, [setEnrolledPeople]);

  // Inject mock faces once camera is ready and WS hasn't taken over
  useEffect(() => {
    if (!cameraReady) return;
    // Only use mock faces if WS hasn't delivered real data
    if (wsStatus !== "open") {
      const t = setTimeout(() => {
        setActiveFaces(MOCK_FACES);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [cameraReady, wsStatus, setActiveFaces]);

  // When WS goes offline again, restore mock faces
  useEffect(() => {
    if (wsStatus === "closed" && cameraReady) {
      setActiveFaces(MOCK_FACES);
    }
  }, [wsStatus, cameraReady, setActiveFaces]);

  // Connect WebSocket — pass canvasRef for frame sampling
  useWebSocket(canvasRef);

  // Draw video frames to canvas
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Mirror the feed
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, []);

  // Start webcam
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const cw = window.innerWidth;
        const ch = window.innerHeight;

        if (canvasRef.current) {
          canvasRef.current.width = cw;
          canvasRef.current.height = ch;
        }

        setDimensions({ videoWidth: vw, videoHeight: vh, containerWidth: cw, containerHeight: ch });
        animFrameRef.current = requestAnimationFrame(drawFrame);
        setCameraReady(true);
      } catch {
        // Camera not available — still show mock faces on a dark background
        console.warn("Camera unavailable — showing mock overlay");
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
        setDimensions({
          videoWidth: 1280,
          videoHeight: 720,
          containerWidth: window.innerWidth,
          containerHeight: window.innerHeight,
        });
        setCameraReady(true);
      }
    }

    startCamera();

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
      setDimensions((d) => ({
        ...d,
        containerWidth: window.innerWidth,
        containerHeight: window.innerHeight,
      }));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [drawFrame]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020810]">
      {/* Hidden video element — source for canvas drawing */}
      <video
        ref={videoRef}
        className="pointer-events-none absolute opacity-0"
        playsInline
        muted
        aria-hidden="true"
      />

      {/* Full-viewport mirrored canvas — the actual visible feed */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ display: "block" }}
      />

      {/* Subtle vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(2,8,16,0.55) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Scanning line */}
      <div
        className="scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(120,200,255,0.35)] to-transparent"
        aria-hidden="true"
      />

      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-base font-medium tracking-[0.22em] text-white/90">
            Mimir
          </span>
          <span className="h-px w-6 bg-[rgba(120,200,255,0.25)]" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            Memory Assistant
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-4">
          <StatusPill />
          <SignOutButton />
        </div>
      </header>

      {/* Admin link — bottom right */}
      <a
        href="/admin"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-white/20 transition-colors hover:text-white/50"
      >
        Caregiver Panel
        <span className="text-[8px]">→</span>
      </a>

      {/* Face overlay */}
      <FaceOverlay
        videoWidth={dimensions.videoWidth}
        videoHeight={dimensions.videoHeight}
        containerWidth={dimensions.containerWidth}
        containerHeight={dimensions.containerHeight}
      />

      {/* Voice button */}
      <VoiceButton currentPersonId={primaryFaceId} />
    </div>
  );
}
