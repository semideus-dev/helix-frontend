import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { relationsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Get logged-in user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, relationship, note, photo } = body;

    if (!name || !relationship) {
      return NextResponse.json(
        { error: "Name and relationship are required" },
        { status: 400 }
      );
    }

    if (!photo) {
      return NextResponse.json(
        { error: "Photo is required" },
        { status: 400 }
      );
    }

    // Insert into database
    const [newPerson] = await db
      .insert(relationsTable)
      .values({
        userId: session.user.id,
        name: name.trim(),
        relation: relationship.toLowerCase(),
        photo: photo, // base64 string
        memoryNote: note?.trim() || null,
        createdAt: new Date(), // Explicitly set timestamp
      })
      .returning();

    return NextResponse.json({
      success: true,
      id: newPerson.id,
      name: newPerson.name,
      relationship: newPerson.relation,
      note: newPerson.memoryNote || "",
    });
  } catch (error) {
    console.error("Enrol error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get logged-in user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Delete from database
    const deleted = await db
      .delete(relationsTable)
      .where(eq(relationsTable.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Person not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
