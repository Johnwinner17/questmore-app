import { db } from "@/db";
import { providerProfessions } from "@/db/schema";
import { mockProfessions } from "@/lib/mock-data";
import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory fallback if DB is offline
let inMemoryProfessions = [...mockProfessions];

export async function GET() {
  try {
    const list = await db
      .select()
      .from(providerProfessions)
      .where(eq(providerProfessions.active, true))
      .orderBy(asc(providerProfessions.sortOrder));

    if (list.length > 0) {
      return NextResponse.json(list);
    }
    return NextResponse.json(inMemoryProfessions);
  } catch (err) {
    return NextResponse.json(inMemoryProfessions);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, icon } = body;
    if (!name) return NextResponse.json({ error: "Profession name is required" }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const [inserted] = await db
        .insert(providerProfessions)
        .values({
          name,
          slug,
          description: description || null,
          icon: icon || "🔧",
          sortOrder: inMemoryProfessions.length + 1,
          active: true,
        })
        .returning();

      if (inserted) {
        inMemoryProfessions.push(inserted as any);
        return NextResponse.json(inserted);
      }
    } catch (dbErr) {
      // Fallback
    }

    const newItem = {
      id: inMemoryProfessions.length + 1,
      name,
      slug,
      description: description || null,
      icon: icon || "🔧",
      sortOrder: inMemoryProfessions.length + 1,
      active: true,
    };
    inMemoryProfessions.push(newItem);
    return NextResponse.json(newItem);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create profession" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, icon, active, sortOrder } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    try {
      const [updated] = await db
        .update(providerProfessions)
        .set({
          ...(name && { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }),
          ...(description !== undefined && { description }),
          ...(icon && { icon }),
          ...(active !== undefined && { active: Boolean(active) }),
          ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        })
        .where(eq(providerProfessions.id, Number(id)))
        .returning();

      if (updated) return NextResponse.json(updated);
    } catch (dbErr) {
      // Fallback
    }

    inMemoryProfessions = inMemoryProfessions.map(p =>
      p.id === Number(id)
        ? {
            ...p,
            ...(name && { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }),
            ...(description !== undefined && { description }),
            ...(icon && { icon }),
            ...(active !== undefined && { active: Boolean(active) }),
            ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
          }
        : p
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update profession" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
      await db.delete(providerProfessions).where(eq(providerProfessions.id, id));
    } catch (e) {
      // Fallback
    }

    inMemoryProfessions = inMemoryProfessions.filter(p => p.id !== id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete profession" }, { status: 500 });
  }
}
