import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, desc, or, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

// GET /api/notifications?email=...&userId=...&role=...
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const userIdParam = req.nextUrl.searchParams.get("userId");
  const role = req.nextUrl.searchParams.get("role") || "client";

  try {
    let notifs: any[] = [];

    try {
      // Fetch all notifications relevant to this user:
      //  1. Notifications where userEmail matches exactly (direct message to them)
      //  2. Notifications where target = 'all' (everyone sees)
      //  3. Notifications where target matches their role ('clients' or 'providers')
      //  4. Notifications where userId matches (DB-stored user-specific)
      const allNotifs = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(100);

      // Filter client-side for correct targeting
      if (email) {
        const lowerEmail = email.toLowerCase();
        notifs = allNotifs.filter((n: any) => {
          // Direct message to this email
          if (n.userEmail && n.userEmail.toLowerCase() === lowerEmail) return true;
          // Broadcast to all
          if (n.target === "all" || n.target === "everyone") return true;
          // Role-targeted broadcast
          if (n.target === "clients" && role === "client") return true;
          if (n.target === "providers" && role === "provider") return true;
          // User-id-targeted
          if (userIdParam && n.userId === parseInt(userIdParam)) return true;
          // Old-style: no userEmail = global broadcast
          if (!n.userEmail && !n.target) return true;
          return false;
        });
      } else {
        // No email filter — return all (admin view)
        notifs = allNotifs;
      }
    } catch (dbErr) {
      console.warn("DB query error in notifications GET:", dbErr);
    }

    // Fallback: serverStore
    if (notifs.length === 0 && (serverStore as any).notifications) {
      const storeNotifs = (serverStore as any).notifications || [];
      if (email) {
        const lowerEmail = email.toLowerCase();
        notifs = storeNotifs.filter((n: any) => {
          if (n.userEmail && n.userEmail.toLowerCase() === lowerEmail) return true;
          if (n.target === "all" || n.target === "everyone") return true;
          if (n.target === "clients" && role === "client") return true;
          if (n.target === "providers" && role === "provider") return true;
          if (!n.userEmail && !n.target) return true;
          return false;
        });
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
    const {
      title,
      message,
      type = "announcement",
      userEmail,
      userId,
      userRole = "client",
      target = "specific",  // 'specific' | 'all' | 'clients' | 'providers'
      actionUrl,
      requestId
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const newNotification = {
      id: Date.now(),
      userId: userId ? parseInt(String(userId), 10) : null,
      userEmail: userEmail ? String(userEmail).toLowerCase().trim() : null,
      userRole: userRole || "client",
      title: String(title).trim(),
      message: String(message).trim(),
      type: type || "announcement",
      target: target || "specific",
      actionUrl: actionUrl || null,
      requestId: requestId || null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Save to DB
    try {
      await db.insert(notifications).values({
        userId: newNotification.userId,
        userEmail: newNotification.userEmail,
        userRole: newNotification.userRole,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        target: newNotification.target,
        read: false,
        linkUrl: actionUrl || null,
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
          if (!email || n.userEmail === email || !n.userEmail) n.read = true;
        });
      }
      try {
        if (email) {
          await db.update(notifications).set({ read: true }).where(eq(notifications.userEmail, email));
        }
      } catch (e) {}
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
