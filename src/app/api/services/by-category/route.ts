import { db, ensureDbInitialized } from "@/db";
import { services } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json([]);
  }

  try {
    await ensureDbInitialized().catch(() => {});
    const data = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.categoryId, Number(categoryId)),
          eq(services.active, true)
        )
      )
      .orderBy(asc(services.sortOrder));

    if (Array.isArray(data)) {
      return NextResponse.json(data);
    }
  } catch (e) {
    console.error("by-category DB error:", e);
  }

  // Fallback to serverStore if DB unavailable
  const filtered = serverStore.services.filter(
    (s) => s.categoryId === Number(categoryId) && s.active !== false
  );
  return NextResponse.json(filtered);
}
