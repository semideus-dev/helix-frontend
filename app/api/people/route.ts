import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { relationsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Get logged-in user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all enrolled people for this user
    const people = await db
      .select()
      .from(relationsTable)
      .where(eq(relationsTable.userId, session.user.id));

    // Transform to match frontend Person type
    const transformedPeople = people.map((person) => ({
      id: person.id,
      name: person.name,
      relationship: person.relation,
      note: person.memoryNote || "",
      photoUrl: person.photo,
      lastSeen: undefined,
    }));

    return NextResponse.json({ success: true, people: transformedPeople });
  } catch (error) {
    console.error("Fetch people error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
