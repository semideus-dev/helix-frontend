import type { Face, Person, LogEntry } from "@/types";

// Mock faces positioned in video-space coords (1280×720 source frame).
// The overlay scales these to actual viewport size.
export const MOCK_FACES: Face[] = [
  {
    id: "mock-shabad",
    name: "Gurshabad",
    relationship: "Son",
    note: "Loves to code, and rage quit when bugs arise. Last seen wearing all black.",
    lastSeen: "2 days ago",
    confidence: 0.94,
    bbox: { top: 100, right: 780, bottom: 540, left: 480 },
  },
];

// Mock enrolled people seeded into the admin panel
export const MOCK_PEOPLE: Person[] = [
  {
    id: "mock-shabad",
    name: "Gurshabad",
    relationship: "Son",
    note: "Loves to code, and rage quit when bugs arise. Last seen wearing all black.",
    lastSeen: "2 days ago",
  },
  {
    id: "mock-dr-patel",
    name: "Dr. Ravi Patel",
    relationship: "Doctor",
    note: "Weekly check-up on Thursdays. Cardiologist.",
    lastSeen: "5 days ago",
  },
  {
    id: "mock-james",
    name: "James Okonkwo",
    relationship: "Friend",
    note: "Old colleague. Brings crossword puzzles on Tuesdays.",
    lastSeen: "1 week ago",
  },
];

const now = new Date();
export const MOCK_RECOGNITION_LOG: LogEntry[] = [
  {
    id: "log-1",
    personId: "mock-shabad",
    personName: "Gurshabad",
    relationship: "Son",
    timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    confidence: 0.96,
  },
  {
    id: "log-2",
    personId: "mock-dr-patel",
    personName: "Dr. Ravi Patel",
    relationship: "Doctor",
    timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    confidence: 0.91,
  },
  {
    id: "log-3",
    personId: "mock-james",
    personName: "James Okonkwo",
    relationship: "Friend",
    timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    confidence: 0.88,
  },
  {
    id: "log-4",
    personId: "mock-shabad",
    personName: "Gurshabad",
    relationship: "Son",
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    confidence: 0.94,
  },
  {
    id: "log-5",
    personId: "mock-shabad",
    personName: "Gurshabad",
    relationship: "Son",
    timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    confidence: 0.97,
  },
];
