import { db, ensureDbInitialized } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { hashPassword, verifyPassword, sanitizeUser, generateAuthTokens } from "@/lib/auth-crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const { action } = body; // 'register' | 'login'

    // ─────────────────────────────────────────────────────────────────────────
    // 1. PROVIDER LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Please provide both email and password." }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      let providerUser: any = null;
      try {
        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, cleanEmail))
          .limit(1);
        if (found.length > 0) providerUser = found[0];
      } catch (e) {
        console.error("DB provider login lookup error:", e);
      }

      if (!providerUser) {
        providerUser = serverStore.users.find(
          (u) => u.email?.toLowerCase() === cleanEmail && u.role === "provider"
        );
      }

      if (!providerUser) {
        return NextResponse.json(
          { error: "No service provider account found with this email. Please register first." },
          { status: 404 }
        );
      }

      if (providerUser.status === "suspended" || providerUser.status === "deactivated") {
        return NextResponse.json(
          { error: "Your service provider account has been suspended. Please contact admin." },
          { status: 403 }
        );
      }

      // Verify password with secure crypto
      const isPasswordValid = verifyPassword(password, providerUser.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 401 }
        );
      }

      // Update lastLoginAt
      const now = new Date();
      try {
        await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, providerUser.id));
        providerUser.lastLoginAt = now;
      } catch (e) {}

      const tokens = generateAuthTokens(providerUser.id, providerUser.email);

      return NextResponse.json({
        success: true,
        user: sanitizeUser(providerUser),
        isVerified: providerUser.verificationStatus === "verified",
        tokens,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PROVIDER REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────
    const {
      fullName,
      phone,
      email,
      password,
      location,
      address,
      avatarUrl,
      professionId,
      professionName,
      experienceYears,
      qualifications,
      idDocumentUrl,
      bio,
    } = body;

    if (!fullName || !email || !phone || !professionName) {
      return NextResponse.json(
        { error: "Full name, email, phone number, and profession are required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    try {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }
    } catch (e) {}

    const passwordHash = hashPassword(password);
    const now = new Date();

    const newProviderData = {
      role: "provider",
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      passwordHash,
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      location: location || "Abuja",
      address: address || null,
      professionId: professionId ? Number(professionId) : null,
      professionName,
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      qualifications: qualifications || null,
      idDocumentUrl: idDocumentUrl || null,
      bio: bio || null,
      verificationStatus: "awaiting_verification",
      verified: false,
      status: "active",
      lastLoginAt: now,
    };

    let createdUser: any = null;

    try {
      const [inserted] = await db
        .insert(users)
        .values(newProviderData as any)
        .returning();
      if (inserted) createdUser = inserted;
    } catch (e) {
      console.error("DB insert provider error:", e);
    }

    if (!createdUser) {
      createdUser = {
        id: Date.now(),
        ...newProviderData,
        createdAt: now.toISOString(),
      };
      serverStore.users.push(createdUser as any);
    } else {
      serverStore.users.push(createdUser);
    }

    const tokens = generateAuthTokens(createdUser.id, createdUser.email);

    return NextResponse.json({
      success: true,
      user: sanitizeUser(createdUser),
      isVerified: false,
      message: "Application submitted! QuestMore verification desk will review your trade credentials.",
      tokens,
    });
  } catch (error) {
    console.error("Provider Auth error:", error);
    return NextResponse.json(
      { error: "Provider authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
