import { db, ensureDbInitialized } from "@/db";
import { services, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized().catch(() => {});
    const data = await db
      .select({
        id: services.id,
        name: services.name,
        shortDescription: services.shortDescription,
        imageUrl: services.imageUrl,
        categoryId: services.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
      })
      .from(services)
      .leftJoin(categories, eq(services.categoryId, categories.id))
      .where(eq(services.active, true))
      .orderBy(asc(categories.sortOrder), asc(services.sortOrder));

    if (data && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("Services all DB error:", err);
  }

  // Fallback to serverStore / mockServices (16 services)
  const fallback = serverStore.services.map((s) => {
    const cat = serverStore.categories.find((c) => c.id === s.categoryId);
    return {
      id: s.id,
      name: s.name,
      shortDescription: s.shortDescription,
      imageUrl: s.imageUrl,
      categoryId: s.categoryId,
      categoryName: cat?.name || "Engineering Service",
      categoryIcon: cat?.icon || "tool",
    };
  });

  return NextResponse.json(fallback);
}
