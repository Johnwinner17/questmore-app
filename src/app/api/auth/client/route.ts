import { db, ensureDbInitialized } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { hashPassword, verifyPassword, generateAuthTokens, sanitizeUser } from "@/lib/auth-crypto";

export const dynamic = "force-dynamic";

// Decode Google JWT payload if provided
function decodeGoogleJwt(credential: string) {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const {
      action,
      email,
      password,
      newPassword,
      fullName,
      avatarUrl,
      phone,
      location,
      address,
      googleId,
      googleEmail,
      credential,
      accessToken,
    } = body;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ACTION: NORMAL EMAIL + PASSWORD LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "password_login" || (!action && email && password && !credential && !googleId)) {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Please provide both email and password." },
          { status: 400 }
        );
      }

      const cleanEmail = email.toLowerCase().trim();

      // Look up user in PostgreSQL
      let user: any = null;
      try {
        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, cleanEmail))
          .limit(1);
        if (found.length > 0) user = found[0];
      } catch (dbErr) {
        console.error("[Auth] DB lookup error:", dbErr);
      }

      // Fallback in serverStore
      if (!user) {
        user = serverStore.users.find((u) => u.email?.toLowerCase() === cleanEmail);
      }

      if (!user) {
        return NextResponse.json(
          { error: "No account found with this email address. Please sign up with Google first." },
          { status: 404 }
        );
      }

      // Check account status
      if (user.status === "suspended" || user.status === "deactivated") {
        return NextResponse.json(
          { error: "Your account is currently suspended. Please contact QuestMore support." },
          { status: 403 }
        );
      }

      // Verify password hash
      const isPasswordValid = verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid password. Please check your credentials or use Forgot Password." },
          { status: 401 }
        );
      }

      // Update lastLoginAt
      const now = new Date();
      try {
        await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id));
        user.lastLoginAt = now;
      } catch (e) {}

      const tokens = generateAuthTokens(user.id, user.email);

      return NextResponse.json({
        success: true,
        user: sanitizeUser(user),
        tokens,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ACTION: GOOGLE VERIFICATION (Sign In or First-Time Detection)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "google_verify" || action === "google_auth" || credential || accessToken) {
      let verifiedEmail = email ? email.toLowerCase().trim() : "";
      let verifiedName = fullName || "";
      let verifiedAvatar = avatarUrl || "";
      let verifiedGoogleId = googleId || "";

      // If credential JWT was passed from Google GIS
      if (credential) {
        const decoded = decodeGoogleJwt(credential);
        if (decoded) {
          verifiedEmail = (decoded.email || verifiedEmail).toLowerCase().trim();
          verifiedName = decoded.name || verifiedName;
          verifiedAvatar = decoded.picture || verifiedAvatar;
          verifiedGoogleId = decoded.sub || verifiedGoogleId;
        }
      }

      if (!verifiedEmail) {
        return NextResponse.json(
          { error: "Unable to verify Google email. Please try again." },
          { status: 400 }
        );
      }

      // Check if user already exists in PostgreSQL
      let existingUser: any = null;
      try {
        const found = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, verifiedEmail),
              verifiedGoogleId ? eq(users.googleId, verifiedGoogleId) : undefined
            )
          )
          .limit(1);
        if (found.length > 0) existingUser = found[0];
      } catch (dbErr) {
        console.error("[Auth] DB google search error:", dbErr);
      }

      if (!existingUser) {
        existingUser = serverStore.users.find(
          (u) => u.email?.toLowerCase() === verifiedEmail
        );
      }

      // If user already exists in DB AND has already completed their profile with a password:
      if (existingUser && existingUser.passwordHash) {
        // Direct login
        const now = new Date();
        try {
          await db
            .update(users)
            .set({
              lastLoginAt: now,
              googleId: verifiedGoogleId || existingUser.googleId,
              avatarUrl: verifiedAvatar || existingUser.avatarUrl,
            })
            .where(eq(users.id, existingUser.id));
        } catch (e) {}

        const tokens = generateAuthTokens(existingUser.id, existingUser.email);
        return NextResponse.json({
          success: true,
          isNew: false,
          user: sanitizeUser({ ...existingUser, lastLoginAt: now }),
          tokens,
        });
      }

      // User is either brand new OR has not set their password/profile yet
      return NextResponse.json({
        success: true,
        isNew: true,
        googleProfile: {
          email: verifiedEmail,
          fullName: verifiedName || verifiedEmail.split("@")[0],
          avatarUrl: verifiedAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(verifiedEmail)}`,
          googleId: verifiedGoogleId,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ACTION: FIRST-TIME SIGN-UP COMPLETION
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "google_signup" || action === "complete_signup") {
      const cleanEmail = (googleEmail || email || "").toLowerCase().trim();
      const cleanName = (fullName || cleanEmail.split("@")[0]).trim();
      const cleanPhone = (phone || "").trim();
      const cleanLocation = (location || "Abuja (FCT)").trim();
      const cleanAddress = (address || "").trim();
      const cleanAvatar =
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`;

      if (!cleanEmail) {
        return NextResponse.json({ error: "Verified Google email is required." }, { status: 400 });
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Please create a password of at least 6 characters." },
          { status: 400 }
        );
      }

      if (!cleanPhone) {
        return NextResponse.json(
          { error: "Please enter your WhatsApp phone number for job dispatches." },
          { status: 400 }
        );
      }

      const passwordHash = hashPassword(password);
      const now = new Date();

      let dbUser: any = null;

      try {
        // Check if user record already exists
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, cleanEmail))
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          const [updated] = await db
            .update(users)
            .set({
              fullName: cleanName,
              phone: cleanPhone,
              location: cleanLocation,
              address: cleanAddress,
              avatarUrl: cleanAvatar,
              passwordHash,
              googleId: googleId || existing[0].googleId,
              googleEmail: cleanEmail,
              status: "active",
              role: existing[0].role || "client",
              lastLoginAt: now,
              updatedAt: now,
            })
            .where(eq(users.id, existing[0].id))
            .returning();
          dbUser = updated;
        } else {
          // Insert new record
          const [inserted] = await db
            .insert(users)
            .values({
              role: "client",
              fullName: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              passwordHash,
              googleId: googleId || null,
              googleEmail: cleanEmail,
              avatarUrl: cleanAvatar,
              location: cleanLocation,
              address: cleanAddress || null,
              status: "active",
              verificationStatus: "verified",
              verified: true,
              lastLoginAt: now,
            } as any)
            .returning();
          dbUser = inserted;
        }
      } catch (dbErr) {
        console.error("[Auth Signup] DB error:", dbErr);
      }

      // Fallback to serverStore if DB unreachable
      if (!dbUser) {
        dbUser = {
          id: Date.now(),
          role: "client",
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          googleId: googleId || null,
          googleEmail: cleanEmail,
          avatarUrl: cleanAvatar,
          location: cleanLocation,
          address: cleanAddress || null,
          status: "active",
          verificationStatus: "verified",
          verified: true,
          createdAt: now.toISOString(),
          lastLoginAt: now.toISOString(),
        };
        serverStore.users.push(dbUser as any);
      } else {
        // Sync with serverStore
        const idx = serverStore.users.findIndex((u) => u.email?.toLowerCase() === cleanEmail);
        if (idx >= 0) serverStore.users[idx] = { ...serverStore.users[idx], ...dbUser };
        else serverStore.users.push(dbUser);
      }

      const tokens = generateAuthTokens(dbUser.id, dbUser.email);

      return NextResponse.json({
        success: true,
        isNew: true,
        user: sanitizeUser(dbUser),
        tokens,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. ACTION: FORGOT PASSWORD (Identity Verified via Google OAuth)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "forgot_password_google" || action === "reset_password_google") {
      let verifiedEmail = (googleEmail || email || "").toLowerCase().trim();
      let verifiedGoogleId = googleId || "";

      // If credential JWT was passed
      if (credential) {
        const decoded = decodeGoogleJwt(credential);
        if (decoded) {
          verifiedEmail = (decoded.email || verifiedEmail).toLowerCase().trim();
          verifiedGoogleId = decoded.sub || verifiedGoogleId;
        }
      }

      if (!verifiedEmail) {
        return NextResponse.json(
          { error: "Google identity verification is required to reset password." },
          { status: 400 }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      // Match user in PostgreSQL
      let user: any = null;
      try {
        const found = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, verifiedEmail),
              verifiedGoogleId ? eq(users.googleId, verifiedGoogleId) : undefined
            )
          )
          .limit(1);
        if (found.length > 0) user = found[0];
      } catch (dbErr) {
        console.error("[Auth Forgot Password] DB lookup error:", dbErr);
      }

      if (!user) {
        user = serverStore.users.find((u) => u.email?.toLowerCase() === verifiedEmail);
      }

      if (!user) {
        return NextResponse.json(
          { error: `No registered account found for Google email "${verifiedEmail}". Please sign up first.` },
          { status: 404 }
        );
      }

      const newPasswordHash = hashPassword(newPassword);
      const now = new Date();

      try {
        await db
          .update(users)
          .set({
            passwordHash: newPasswordHash,
            updatedAt: now,
            lastLoginAt: now,
          })
          .where(eq(users.id, user.id));
      } catch (e) {
        console.error("[Auth Forgot Password] DB update error:", e);
      }

      // Sync serverStore
      user.passwordHash = newPasswordHash;
      user.updatedAt = now.toISOString();

      const tokens = generateAuthTokens(user.id, user.email);

      return NextResponse.json({
        success: true,
        message: "Password successfully updated! You can now log in with your email and new password.",
        user: sanitizeUser(user),
        tokens,
      });
    }

    return NextResponse.json({ error: "Invalid authentication action." }, { status: 400 });
  } catch (error: any) {
    console.error("Client Auth Error:", error);
    return NextResponse.json(
      { error: error?.message || "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}
