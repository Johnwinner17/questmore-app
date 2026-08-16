import { db } from "@/db";
import { services, categories } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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

  return NextResponse.json(data);
}
