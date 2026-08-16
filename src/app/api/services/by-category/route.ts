import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { mockServices } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json([]);
  }

  try {
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

    return NextResponse.json(data);
  } catch (e) {
    const filtered = mockServices.filter(s => s.categoryId === Number(categoryId));
    return NextResponse.json(filtered.length > 0 ? filtered : mockServices);
  }
}

