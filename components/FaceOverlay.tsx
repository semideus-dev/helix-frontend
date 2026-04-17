"use client";

import { useMimirStore } from "@/lib/store";
import { FaceCard } from "./FaceCard";
import type { Face } from "@/types";

interface FaceOverlayProps {
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
}

function BracketBox({ face, scaleX, scaleY }: { face: Face; scaleX: number; scaleY: number }) {
  const top = face.bbox.top * scaleY;
  const left = face.bbox.left * scaleX;
  const width = (face.bbox.right - face.bbox.left) * scaleX;
  const height = (face.bbox.bottom - face.bbox.top) * scaleY;

  // Mirror the x-coordinates because the canvas is mirrored (scaleX(-1))
  const mirroredLeft = window.innerWidth - left - width;

  const flipLeft = mirroredLeft > window.innerWidth / 2;

  return (
    <div
      className="absolute"
      style={{ top, left: mirroredLeft, width, height }}
    >
      {/* Corner bracket decorations */}
      <span className="bracket-corner bracket-tl" />
      <span className="bracket-corner bracket-tr" />
      <span className="bracket-corner bracket-bl" />
      <span className="bracket-corner bracket-br" />

      {/* Face info card positioned to the side of the bbox */}
      <FaceCard
        face={face}
        style={{ top: 0 }}
        flipLeft={flipLeft}
      />
    </div>
  );
}

export function FaceOverlay({
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
}: FaceOverlayProps) {
  const activeFaces = useMimirStore((s) => s.activeFaces);

  if (!videoWidth || !videoHeight || !containerWidth || !containerHeight) {
    return null;
  }

  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;

  return (
    <div className="pointer-events-none fixed inset-0">
      {activeFaces.map((face) => (
        <BracketBox
          key={face.id}
          face={face}
          scaleX={scaleX}
          scaleY={scaleY}
        />
      ))}
    </div>
  );
}
