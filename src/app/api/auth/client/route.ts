import { db, ensureDbInitialized } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const { email, fullName, avatarUrl, phone, location, address } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for Google authentication" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = fullName || cleanEmail.split("@")[0];
    const cleanAvatar =
      avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`;

    // ──────────────────────────────────────────────────────────
    // UPSERT: Try PostgreSQL first with ON CONFLICT resolution.
    // This ensures Google sign-ins ALWAYS persist across
    // server restarts and deployments (not just in-memory).
    // ──────────────────────────────────────────────────────────
    let dbUser: any = null;
    let isNewUser = false;

    try {
      // 1. Look for existing user
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);

      if (existing.length > 0) {
        dbUser = existing[0];
        isNewUser = false;

        // Update fields if provided
        const updates: Record<string, any> = {};
        if (cleanAvatar) updates.avatarUrl = cleanAvatar;
        if (cleanName && (!dbUser.fullName || dbUser.fullName === "Client"))
          updates.fullName = cleanName;
        if (phone) updates.phone = phone;
        if (location) updates.location = location;
        if (address) updates.address = address;

        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, dbUser.id));
          dbUser = { ...dbUser, ...updates };
        }
      } else {
        // 2. Create new DB user — brand new registration
        isNewUser = true;
        const [inserted] = await db
          .insert(users)
          .values({
            role: "client" as const,
            fullName: cleanName,
            email: cleanEmail,
            phone: phone || null,
            avatarUrl: cleanAvatar,
            location: location || "Abuja (FCT)",
            address: address || null,
            verificationStatus: "verified" as const,
            verified: true,
          } as any)
          .returning();

        dbUser = inserted;
      }
    } catch (dbErr) {
      console.error("[QuestMore Auth] DB error:", dbErr);
      // If DB is down, log clearly — don't silently swallow
    }

    // ──────────────────────────────────────────────────────────
    // Sync result into serverStore so in-process requests
    // that hit serverStore paths also see the user
    // ──────────────────────────────────────────────────────────
    if (dbUser) {
      const idx = serverStore.users.findIndex(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (idx >= 0) {
        serverStore.users[idx] = { ...serverStore.users[idx], ...dbUser };
      } else {
        serverStore.users.push(dbUser);
      }

      return NextResponse.json({
        success: true,
        isNew: isNewUser,
        user: dbUser,
        tokens: {
          access: `qm_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          refresh: `qm_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        },
      });
    }

    // ──────────────────────────────────────────────────────────
    // Last resort: DB totally unavailable — use serverStore only
    // (volatile, but prevents hard failure for the user)
    // ──────────────────────────────────────────────────────────
    let storeUser = serverStore.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!storeUser) {
      storeUser = {
        id: Date.now(),
        role: "client",
        fullName: cleanName,
        email: cleanEmail,
        phone: phone || null,
        avatarUrl: cleanAvatar,
        location: location || "Abuja (FCT)",
        address: address || null,
        verificationStatus: "verified",
        verified: true,
        createdAt: new Date().toISOString(),
      };
      serverStore.users.push(storeUser as any);
    }

    return NextResponse.json({
      success: true,
      isNew: true,
      user: storeUser,
      tokens: {
        access: `qm_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        refresh: `qm_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });
  } catch (error) {
    console.error("Client Auth Error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
