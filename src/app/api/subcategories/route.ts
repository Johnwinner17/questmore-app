import { db } from "@/db";
import { subcategories } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { mockSubcategories } from "@/lib/mock-data";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json([]);
  }

  try {
    const data = await db
      .select()
      .from(subcategories)
      .where(
        and(
          eq(subcategories.categoryId, Number(categoryId)),
          eq(subcategories.active, true)
        )
      )
      .orderBy(asc(subcategories.sortOrder));

    return NextResponse.json(data);
  } catch (e) {
    const filtered = mockSubcategories.filter(s => s.categoryId === Number(categoryId));
    return NextResponse.json(filtered.length > 0 ? filtered : mockSubcategories);
  }
}

