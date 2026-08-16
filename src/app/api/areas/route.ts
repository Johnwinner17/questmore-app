import { db } from "@/db";
import { serviceAreas } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { mockAreas } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(serviceAreas)
      .where(eq(serviceAreas.active, true))
      .orderBy(asc(serviceAreas.state), asc(serviceAreas.name));

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(mockAreas);
  }
}

