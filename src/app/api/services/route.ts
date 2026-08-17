import { db, ensureDbInitialized } from "@/db";
import { services } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const subcategoryId = req.nextUrl.searchParams.get("subcategoryId");

  if (!subcategoryId) {
    return NextResponse.json([]);
  }

  try {
    await ensureDbInitialized().catch(() => {});
    const data = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.subcategoryId, Number(subcategoryId)),
          eq(services.active, true)
        )
      )
      .orderBy(asc(services.sortOrder));

    if (data && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (e) {
    console.error("services subcategory DB error:", e);
  }

  // Fallback to serverStore (has all 16 services)
  const filtered = serverStore.services.filter(s => s.subcategoryId === Number(subcategoryId));
  return NextResponse.json(filtered.length > 0 ? filtered : serverStore.services);
}
