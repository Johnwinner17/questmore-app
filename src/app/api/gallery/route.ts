import { db } from "@/db";
import { projectGallery } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(projectGallery)
      .orderBy(desc(projectGallery.createdAt));

    if (data && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (e) {
    // Fallback to serverStore
  }

  return NextResponse.json(serverStore.gallery);
}
