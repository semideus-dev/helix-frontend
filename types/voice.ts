export interface TranscriptSegment {
  index:      number;
  text:       string;
  isFinal:    boolean;
  confidence: number;
  timestamp:  string; // ISO 8601
}

export interface VoiceSessionPayload {
  sessionId:       string;
  userId:          string | null;
  startedAt:       string;
  endedAt:         string;
  durationSeconds: number;
  endReason:       'manual' | 'silence_timeout';
  transcript:      TranscriptSegment[];
  fullText:        string;
  wordCount:       number;
  activeFaceId:    string | null;
  activeFaceName:  string | null;
}

export type VoiceStatus = 'idle' | 'listening' | 'speaking' | 'silence' | 'processing';
