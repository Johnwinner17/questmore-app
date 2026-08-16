import { db } from "@/db";
import { faqs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { mockFaqs } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(faqs)
      .where(eq(faqs.active, true))
      .orderBy(asc(faqs.sortOrder));

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(mockFaqs);
  }
}

