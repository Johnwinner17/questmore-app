import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, desc, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

// GET /api/notifications?email=...&userId=...
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const userIdParam = req.nextUrl.searchParams.get("userId");

  try {
    let notifs: any[] = [];
    try {
      if (userIdParam) {
        notifs = await db
          .select()
          .from(notifications)
          .where(or(eq(notifications.userId, parseInt(userIdParam, 10)), isNull(notifications.userId)))
          .orderBy(desc(notifications.createdAt))
          .limit(50);
      } else {
        notifs = await db
          .select()
          .from(notifications)
          .orderBy(desc(notifications.createdAt))
          .limit(50);
      }
    } catch (dbErr) {
      console.warn("DB query error in notifications GET:", dbErr);
    }

    if (notifs.length === 0 && (serverStore as any).notifications) {
      const storeNotifs = (serverStore as any).notifications || [];
      if (email) {
        notifs = storeNotifs.filter((n: any) => !n.userEmail || n.userEmail === email || n.target === "all");
      } else {
        notifs = storeNotifs;
      }
    }

    return NextResponse.json(notifs);
  } catch (e: any) {
    return NextResponse.json([]);
  }
}

// POST /api/notifications (Admin broadcast or direct client feedback)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, type = "announcement", userEmail, userId, actionUrl, requestId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const newNotification = {
      id: Date.now(),
      userId: userId ? parseInt(String(userId), 10) : null,
      userEmail: userEmail || null,
      title: String(title).trim(),
      message: String(message).trim(),
      type: type || "announcement", // announcement, request_update, admin_feedback, promo, alert
      actionUrl: actionUrl || null,
      requestId: requestId || null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Save to DB
    try {
      await db.insert(notifications).values({
        userId: newNotification.userId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        read: false,
      });
    } catch (dbErr) {
      console.warn("DB insert error in notifications POST:", dbErr);
    }

    // Save to serverStore
    if (!(serverStore as any).notifications) {
      (serverStore as any).notifications = [];
    }
    (serverStore as any).notifications.unshift(newNotification);

    return NextResponse.json({ success: true, notification: newNotification });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/notifications (Mark as read)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, markAllRead, email } = body;

    if (markAllRead) {
      if ((serverStore as any).notifications) {
        (serverStore as any).notifications.forEach((n: any) => {
          if (!email || n.userEmail === email) n.read = true;
        });
      }
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (notificationId) {
      if ((serverStore as any).notifications) {
        const notif = (serverStore as any).notifications.find((n: any) => n.id === notificationId);
        if (notif) notif.read = true;
      }
      try {
        await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
      } catch (e) {}
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
