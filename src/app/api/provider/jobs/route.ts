import { db } from "@/db";
import { serviceRequests, users, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

// Helper: push notification into DB + serverStore
async function pushNotification({
  userEmail,
  userId,
  title,
  message,
  type = "request_update",
}: {
  userEmail?: string | null;
  userId?: number | null;
  title: string;
  message: string;
  type?: string;
}) {
  const record = {
    id: Date.now() + Math.random(),
    userId: userId || null,
    userEmail: userEmail || null,
    title,
    message,
    type,
    target: userEmail ? "specific" : "all",
    read: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.insert(notifications).values({
      userId: record.userId,
      userEmail: record.userEmail,
      title: record.title,
      message: record.message,
      type: record.type,
      target: record.target,
      read: false,
    });
  } catch (e) {}

  if (!(serverStore as any).notifications) (serverStore as any).notifications = [];
  (serverStore as any).notifications.unshift(record);
}

// GET /api/provider/jobs?providerId=...
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get("providerId");
  const email = req.nextUrl.searchParams.get("email");

  try {
    if (providerId) {
      // Try DB first
      try {
        const dbResults = await db
          .select()
          .from(serviceRequests)
          .where(eq(serviceRequests.assignedProviderId, Number(providerId)))
          .orderBy(desc(serviceRequests.createdAt));

        if (dbResults && dbResults.length >= 0) {
          return NextResponse.json(dbResults);
        }
      } catch (e) {}

      // Fallback to serverStore
      const storeJobs = serverStore.requests.filter(
        (r: any) => r.assignedProviderId === Number(providerId)
      );
      return NextResponse.json(storeJobs);
    }

    // No filter — return all (admin)
    try {
      const allJobs = await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
      if (allJobs) return NextResponse.json(allJobs);
    } catch (e) {}

    return NextResponse.json(serverStore.requests);
  } catch (e) {
    return NextResponse.json([]);
  }
}

// POST /api/provider/jobs — provider actions: accept_job | start_work | mark_completed | decline_job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, requestId, providerId, note } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "Missing requestId or action" }, { status: 400 });
    }

    let updateFields: Record<string, any> = {};
    let clientNotifTitle = "";
    let clientNotifMsg = "";
    let adminNotifMsg = "";

    const now = new Date();

    switch (action) {
      case "accept_job":
        updateFields = {
          jobStatus: "provider_accepted",
          status: "confirmed",
          acceptedAt: now,
          statusNote: note || "Job accepted by service specialist. Preparing tools and materials for site visit.",
        };
        clientNotifTitle = "Specialist Accepted Your Job ✓";
        clientNotifMsg = "Your assigned engineer has accepted the job and is currently preparing tools and materials. Expect a site visit shortly.";
        adminNotifMsg = `Provider accepted job request ${requestId}`;
        break;

      case "start_work":
        updateFields = {
          jobStatus: "work_in_progress",
          status: "in_progress",
          workStartedAt: now,
          statusNote: note || "Service specialist is currently on-site executing work.",
        };
        clientNotifTitle = "⚡ Work Has Started!";
        clientNotifMsg = "Your specialist is now on-site and work is actively in progress. You will be notified when work is complete.";
        adminNotifMsg = `Provider started work on job ${requestId}`;
        break;

      case "mark_completed":
        updateFields = {
          jobStatus: "work_completed",
          status: "in_progress",
          workCompletedAt: now,
          statusNote: note || "Work completed by specialist. Awaiting client inspection and sign-off.",
        };
        clientNotifTitle = "✅ Work Completed — Please Inspect!";
        clientNotifMsg = "Your specialist has marked the work as completed. Please inspect the work and confirm completion on your Activity tab to release payment.";
        adminNotifMsg = `Provider marked job ${requestId} as completed`;
        break;

      case "decline_job":
        updateFields = {
          jobStatus: "awaiting_assignment",
          status: "confirmed",
          assignedProviderId: null,
          providerName: null,
          providerPhone: null,
          statusNote: "Specialist declined this job. Admin is finding a replacement.",
        };
        clientNotifTitle = "Job Re-Queuing for Assignment";
        clientNotifMsg = "The initially assigned specialist could not take this job. Our team is working to assign a replacement urgently.";
        adminNotifMsg = `Provider DECLINED job ${requestId} — needs reassignment!`;
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // Find current request for notification details
    let currentReq: any = null;
    try {
      const found = await db.select().from(serviceRequests).where(eq(serviceRequests.id, Number(requestId))).limit(1);
      currentReq = found[0] || null;
    } catch (e) {}

    if (!currentReq) {
      currentReq = serverStore.requests.find((r: any) => r.id === Number(requestId));
    }

    // Update in DB
    try {
      const [updated] = await db
        .update(serviceRequests)
        .set(updateFields)
        .where(eq(serviceRequests.id, Number(requestId)))
        .returning();

      if (updated) {
        currentReq = updated;
      }
    } catch (e) {
      console.error("DB update provider job error:", e);
    }

    // Update serverStore
    serverStore.requests = serverStore.requests.map((r: any) =>
      r.id === Number(requestId) ? { ...r, ...updateFields } : r
    );

    // Notify client via bell
    if (currentReq?.email && clientNotifTitle) {
      await pushNotification({
        userEmail: currentReq.email,
        userId: currentReq.userId || null,
        title: clientNotifTitle,
        message: clientNotifMsg,
        type: "request_update",
      });
    }

    // Notify admin via bell
    if (adminNotifMsg) {
      await pushNotification({
        userEmail: "questdmore@gmail.com",
        title: "⚡ Job Status Update",
        message: `${adminNotifMsg} — Client: ${currentReq?.fullName || "Unknown"} (${currentReq?.requestCode || `QM-REQ-${requestId}`})`,
        type: "admin_alert",
      });
    }

    return NextResponse.json({
      success: true,
      request: { ...currentReq, ...updateFields },
    });
  } catch (error) {
    console.error("Provider job action error:", error);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
