import { db, ensureDbInitialized } from "@/db";
import { notifications, users, serviceRequests } from "@/db/schema";
import { eq, desc, or, and, isNull, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Admin Messaging API
// GET  /api/admin/messages  → admin gets history of all sent messages
// POST /api/admin/messages  → admin sends direct or broadcast message
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    // Return all notifications for admin dashboard (messages sent)
    try {
      const msgs = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(200);
      if (msgs && msgs.length > 0) return NextResponse.json(msgs);
    } catch (e) {}

    return NextResponse.json((serverStore as any).notifications || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const {
      title,
      message,
      type = "admin_message",
      target = "all",           // 'all' | 'clients' | 'providers' | 'specific'
      recipientEmail,            // used when target === 'specific'
      recipientId,               // optional userId
      whatsappPhone,             // if admin wants to send WhatsApp too
      requestId,
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const results: any[] = [];

    if (target === "specific" && recipientEmail) {
      // ── Direct message to one person ────────────────────────────
      const notifRecord = {
        id: Date.now(),
        userId: recipientId ? Number(recipientId) : null,
        userEmail: recipientEmail.trim().toLowerCase(),
        userRole: "client",
        title: title.trim(),
        message: message.trim(),
        type,
        target: "specific",
        read: false,
        requestId: requestId || null,
        createdAt,
      };

      try {
        await db.insert(notifications).values({
          userId: notifRecord.userId,
          userEmail: notifRecord.userEmail,
          title: notifRecord.title,
          message: notifRecord.message,
          type: notifRecord.type,
          target: "specific",
          read: false,
        });
      } catch (e) {
        console.error("DB insert direct notification error:", e);
      }

      if (!(serverStore as any).notifications) (serverStore as any).notifications = [];
      (serverStore as any).notifications.unshift(notifRecord);
      results.push(notifRecord);

    } else if (target === "all" || target === "clients" || target === "providers") {
      // ── Broadcast ──────────────────────────────────────────────
      // Get all users of the target role from DB
      let targetUsers: any[] = [];
      try {
        if (target === "all") {
          targetUsers = await db.select({ id: users.id, email: users.email, role: users.role }).from(users);
        } else {
          const roleFilter = target === "clients" ? "client" : "provider";
          targetUsers = await db.select({ id: users.id, email: users.email, role: users.role })
            .from(users).where(eq(users.role, roleFilter));
        }
      } catch (e) {
        // fallback to serverStore
        if (target === "all") {
          targetUsers = serverStore.users;
        } else {
          const roleFilter = target === "clients" ? "client" : "provider";
          targetUsers = serverStore.users.filter((u: any) => u.role === roleFilter);
        }
      }

      // Broadcast notification record (userEmail = null means visible to all of that role)
      const broadcastRecord = {
        id: Date.now(),
        userId: null,
        userEmail: null,
        userRole: target === "clients" ? "client" : target === "providers" ? "provider" : "all",
        title: title.trim(),
        message: message.trim(),
        type,
        target,
        read: false,
        requestId: requestId || null,
        createdAt,
      };

      try {
        await db.insert(notifications).values({
          userId: null,
          userEmail: null,
          userRole: broadcastRecord.userRole,
          title: broadcastRecord.title,
          message: broadcastRecord.message,
          type: broadcastRecord.type,
          target,
          read: false,
        });
      } catch (e) {
        console.error("DB insert broadcast notification error:", e);
      }

      if (!(serverStore as any).notifications) (serverStore as any).notifications = [];
      (serverStore as any).notifications.unshift(broadcastRecord);
      results.push(broadcastRecord);
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      target,
      message: target === "specific"
        ? `Message delivered to ${recipientEmail}`
        : `Broadcast sent to all ${target === "all" ? "users" : target}`,
    });
  } catch (e: any) {
    console.error("Admin messages POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
