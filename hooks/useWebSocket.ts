"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMimirStore } from "@/lib/store";
import { useInterval } from "./useInterval";

const WS_URL = "ws://localhost:8000/ws";
const FRAME_INTERVAL_MS = 500;

export function useWebSocket(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setWsStatus, setActiveFaces } = useMimirStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("open");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (Array.isArray(data?.faces)) {
          setActiveFaces(data.faces);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setWsStatus("closed");
      // Auto-reconnect after 2s
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [setWsStatus, setActiveFaces]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Send a frame every 500ms when the WS is open
  const sendFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || wsRef.current?.readyState !== WebSocket.OPEN) return;

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      const base64 = dataUrl.split(",")[1];
      if (base64) {
        wsRef.current.send(JSON.stringify({ frame: base64 }));
      }
    } catch {
      // ignore canvas security errors (e.g. cross-origin)
    }
  }, [canvasRef]);

  useInterval(sendFrame, FRAME_INTERVAL_MS);
}
