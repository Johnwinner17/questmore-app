import { db, ensureDbInitialized } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized().catch(() => {});
    const data = await db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder));
    if (Array.isArray(data)) return NextResponse.json(data);
  } catch (e) {
    console.error("categories DB error:", e);
  }
  return NextResponse.json(serverStore.categories.filter((c) => c.active !== false));
}
