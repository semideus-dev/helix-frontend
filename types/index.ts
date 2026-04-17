export interface BBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Face {
  id: string;
  name: string;
  relationship: string;
  note: string;
  lastSeen: string;
  confidence: number;
  bbox: BBox;
}

export interface Person {
  id: string;
  name: string;
  relationship: string;
  note: string;
  photoUrl?: string;
  lastSeen?: string;
}

export interface LogEntry {
  id: string;
  personId: string;
  personName: string;
  relationship: string;
  timestamp: string;
  confidence: number;
}

export type WsStatus = "connecting" | "open" | "closed";
