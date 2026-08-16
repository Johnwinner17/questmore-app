import { db } from "@/db";
import { serviceRequests, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let inMemoryRequests: any[] = [];

export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get("providerId");

  try {
    let dbResults = [];

    if (providerId) {
      dbResults = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.assignedProviderId, Number(providerId)))
        .orderBy(desc(serviceRequests.createdAt));
    } else {
      dbResults = await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
    }

    if (dbResults) {
      return NextResponse.json(dbResults);
    }
  } catch (e) {
    // Fallback to in-memory
  }

  if (providerId) {
    const filtered = inMemoryRequests.filter(r => r.assignedProviderId === Number(providerId));
    return NextResponse.json(filtered);
  }

  return NextResponse.json(inMemoryRequests);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, requestId, providerId, note } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "Missing requestId or action" }, { status: 400 });
    }

    let nextJobStatus = "";
    let updateFields: Record<string, any> = {};

    if (action === "accept_job") {
      nextJobStatus = "provider_accepted";
      updateFields = {
        jobStatus: "provider_accepted",
        status: "confirmed",
        acceptedAt: new Date(),
        statusNote: note || "Job accepted by service provider. Preparing tools and materials.",
      };
    } else if (action === "start_work") {
      nextJobStatus = "work_in_progress";
      updateFields = {
        jobStatus: "work_in_progress",
        status: "in_progress",
        workStartedAt: new Date(),
        statusNote: note || "Service provider is currently on-site executing work.",
      };
    } else if (action === "mark_completed") {
      nextJobStatus = "work_completed";
      updateFields = {
        jobStatus: "work_completed",
        status: "in_progress",
        workCompletedAt: new Date(),
        statusNote: note || "Work completed by service provider. Awaiting client confirmation.",
      };
    }

    try {
      const [updated] = await db
        .update(serviceRequests)
        .set(updateFields)
        .where(eq(serviceRequests.id, Number(requestId)))
        .returning();

      if (updated) {
        return NextResponse.json({ success: true, request: updated });
      }
    } catch (e) {
      // Fallback
    }

    inMemoryRequests = inMemoryRequests.map(r =>
      r.id === Number(requestId)
        ? {
            ...r,
            ...updateFields,
            jobStatus: nextJobStatus as any,
          }
        : r
    );

    const updatedMem = inMemoryRequests.find(r => r.id === Number(requestId));
    return NextResponse.json({ success: true, request: updatedMem });
  } catch (error) {
    console.error("Provider job action error:", error);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
