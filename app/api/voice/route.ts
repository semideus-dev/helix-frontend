import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, currentPersonId } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Stub: in production this would call the AI backend
    const response = currentPersonId
      ? `I heard your question about this person: "${query}". The backend will provide a detailed answer.`
      : `I heard: "${query}". No person is currently identified. Please look at the camera.`;

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
