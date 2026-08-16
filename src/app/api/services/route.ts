import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { mockServices } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const subcategoryId = req.nextUrl.searchParams.get("subcategoryId");

  if (!subcategoryId) {
    return NextResponse.json([]);
  }

  try {
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

    return NextResponse.json(data);
  } catch (e) {
    const filtered = mockServices.filter(s => s.subcategoryId === Number(subcategoryId));
    return NextResponse.json(filtered.length > 0 ? filtered : mockServices);
  }
}

