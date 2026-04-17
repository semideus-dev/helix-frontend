import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const relationship = formData.get("relationship") as string | null;
    const note = formData.get("note") as string | null;
    const photo = formData.get("photo") as File | null;

    if (!name || !relationship) {
      return NextResponse.json({ error: "Name and relationship are required" }, { status: 400 });
    }

    // Stub: in production this would persist to database and enrol with face recognition backend
    const id = randomUUID();

    return NextResponse.json({
      success: true,
      id,
      name,
      relationship,
      note: note ?? "",
      hasPhoto: !!photo,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Stub: in production this would remove from database and face recognition backend
    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
