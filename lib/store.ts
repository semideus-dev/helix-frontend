import { create } from "zustand";
import type { Face, Person, LogEntry, WsStatus } from "@/types";
import type { VoiceSessionPayload, VoiceStatus } from "@/types/voice";

interface MimirState {
  wsStatus: WsStatus;
  activeFaces: Face[];
  enrolledPeople: Person[];
  isListening: boolean;
  lastVoiceResponse: string | null;
  recognitionLog: LogEntry[];
  voiceStatus: VoiceStatus;
  lastSession: VoiceSessionPayload | null;

  setWsStatus: (status: WsStatus) => void;
  setActiveFaces: (faces: Face[]) => void;
  setEnrolledPeople: (people: Person[]) => void;
  addEnrolledPerson: (person: Person) => void;
  removeEnrolledPerson: (id: string) => void;
  setIsListening: (listening: boolean) => void;
  setLastVoiceResponse: (response: string | null) => void;
  addLogEntry: (entry: LogEntry) => void;
  setVoiceStatus: (s: VoiceStatus) => void;
  setLastSession: (p: VoiceSessionPayload) => void;
}

export const useMimirStore = create<MimirState>((set) => ({
  wsStatus: "connecting",
  activeFaces: [],
  enrolledPeople: [],
  isListening: false,
  lastVoiceResponse: null,
  recognitionLog: [],
  voiceStatus: "idle",
  lastSession: null,

  setWsStatus: (status) => set({ wsStatus: status }),

  setActiveFaces: (faces) =>
    set((state) => {
      // Append recognition log entries for newly identified faces
      const newEntries: LogEntry[] = faces
        .filter((f) => f.name && f.confidence > 0.5)
        .map((f) => ({
          id: `${f.id}-${Date.now()}`,
          personId: f.id,
          personName: f.name,
          relationship: f.relationship,
          timestamp: new Date().toISOString(),
          confidence: f.confidence,
        }));

      const combined = [...newEntries, ...state.recognitionLog].slice(0, 50);
      return { activeFaces: faces, recognitionLog: combined };
    }),

  setEnrolledPeople: (people) => set({ enrolledPeople: people }),

  addEnrolledPerson: (person) =>
    set((state) => ({ enrolledPeople: [person, ...state.enrolledPeople] })),

  removeEnrolledPerson: (id) =>
    set((state) => ({
      enrolledPeople: state.enrolledPeople.filter((p) => p.id !== id),
    })),

  setIsListening: (listening) => set({ isListening: listening }),

  setLastVoiceResponse: (response) => set({ lastVoiceResponse: response }),

  addLogEntry: (entry) =>
    set((state) => ({
      recognitionLog: [entry, ...state.recognitionLog].slice(0, 50),
    })),

  setVoiceStatus: (s) => set({ voiceStatus: s }),

  setLastSession: (p) => set({ lastSession: p }),
}));
