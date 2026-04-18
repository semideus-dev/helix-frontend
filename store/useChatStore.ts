import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  status: "sent" | "thinking" | "done";
}

interface ChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isThinking: boolean;
  openChat: () => void;
  closeChat: () => void;
  addMessage: (role: ChatMessage["role"], text: string) => void;
  setThinking: (v: boolean) => void;
  clearChat: () => void;
}

const now = Date.now();

function createMessage(
  role: ChatMessage["role"],
  text: string,
  offsetMs: number,
  status: ChatMessage["status"]
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    timestamp: new Date(now - offsetMs).toISOString(),
    status,
  };
}

const MOCK_MESSAGES: ChatMessage[] = [
  createMessage(
    "assistant",
    "Hello. I'm your memory assistant. I can tell you about the people around you, your schedule, or anything you'd like to remember. Just speak.",
    3 * 60_000,
    "done"
  ),
  createMessage("user", "Who was the woman who visited me yesterday?", 2 * 60_000, "sent"),
  createMessage(
    "assistant",
    "That was Sarah, your daughter. She visits most Sundays and sometimes on weekdays. She brought you dal makhani last time.",
    2 * 60_000 - 8_000,
    "done"
  ),
  createMessage("user", "What day is my doctor's appointment?", 60_000, "sent"),
  createMessage(
    "assistant",
    "Your next appointment with Dr. Arjun Nair at Fortis Hospital is on the 3rd of May. That's a Friday.",
    52_000,
    "done"
  ),
];

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  messages: [],
  isThinking: false,
  openChat: () =>
    set((state) => ({
      isOpen: true,
      messages: state.messages.length === 0 ? MOCK_MESSAGES : state.messages,
    })),
  closeChat: () => set({ isOpen: false, isThinking: false }),
  addMessage: (role, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role,
          text,
          timestamp: new Date().toISOString(),
          status: role === "user" ? "sent" : "done",
        },
      ],
    })),
  setThinking: (v) => set({ isThinking: v }),
  clearChat: () => set({ messages: [], isThinking: false }),
}));
