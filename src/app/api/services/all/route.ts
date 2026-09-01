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
        slug: services.slug,
        shortDescription: services.shortDescription,
        fullDescription: services.fullDescription,
        imageUrl: services.imageUrl,
        price: services.price,
        featured: services.featured,
        active: services.active,
        categoryId: services.categoryId,
        subcategoryId: services.subcategoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
      })
      .from(services)
      .leftJoin(categories, eq(services.categoryId, categories.id))
      .where(eq(services.active, true))
      .orderBy(asc(categories.sortOrder), asc(services.sortOrder));

    if (Array.isArray(data)) {
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("Services all DB error:", err);
  }

  // Fallback to serverStore if DB unavailable
  const fallback = serverStore.services
    .filter((s) => s.active !== false)
    .map((s) => {
      const cat = serverStore.categories.find((c) => c.id === s.categoryId);
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        shortDescription: s.shortDescription,
        fullDescription: s.fullDescription,
        imageUrl: s.imageUrl,
        price: s.price,
        featured: s.featured,
        active: s.active,
        categoryId: s.categoryId,
        subcategoryId: s.subcategoryId,
        categoryName: cat?.name || "Engineering Service",
        categoryIcon: cat?.icon || "tool",
      };
    });

  return NextResponse.json(fallback);
}
