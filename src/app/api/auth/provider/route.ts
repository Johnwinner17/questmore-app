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
    const { action } = body; // 'register' | 'login'

    if (action === "login") {
      const { email, password } = body;
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

      let providerUser: any = null;
      try {
        const found = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
        if (found.length > 0) providerUser = found[0];
      } catch (e) {
        console.error("DB provider login lookup error:", e);
      }

      if (!providerUser) {
        providerUser = serverStore.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase() && u.role === "provider");
      }

      if (providerUser) {
        if (providerUser.passwordHash && password) {
          const expectedHash = `hash_${password}`;
          if (providerUser.passwordHash !== expectedHash && providerUser.passwordHash !== password) {
            return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
          }
        }

        return NextResponse.json({
          success: true,
          user: providerUser,
          isVerified: providerUser.verificationStatus === "verified",
        });
      }

      // Demo provider fallback for quick preview
      if (email.toLowerCase().includes("demo") || email.toLowerCase().includes("john")) {
        const demoUser = {
          id: 2,
          role: "provider",
          fullName: "Engr. John Obi",
          email: email.trim().toLowerCase(),
          phone: "+2348021234567",
          professionId: 1,
          professionName: "Plumber",
          experienceYears: 8,
          qualifications: "COREN Tech, City & Guilds Level 3 Plumbing",
          bio: "Master plumber with 8+ years experience executing commercial plumbing and pipe networks.",
          verificationStatus: "verified",
          verified: true,
          location: "Gwarinpa, Abuja",
        };
        return NextResponse.json({ success: true, user: demoUser, isVerified: true });
      }

      return NextResponse.json({ error: "Account not found. Please register first." }, { status: 404 });
    }

    // Default: 'register'
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

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    try {
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }
    } catch (e) {}

    const newProviderData = {
      role: "provider",
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      passwordHash: password ? `hash_${password}` : null,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      location: location || null,
      address: address || null,
      professionId: professionId ? Number(professionId) : null,
      professionName,
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      qualifications: qualifications || null,
      idDocumentUrl: idDocumentUrl || null,
      bio: bio || null,
      verificationStatus: "awaiting_verification",
      verified: false,
    };

    try {
      const [inserted] = await db.insert(users).values(newProviderData).returning();
      if (inserted) {
        serverStore.users.push(inserted);
        return NextResponse.json({
          success: true,
          user: inserted,
          message: "Application submitted successfully! Your account is currently awaiting verification by QuestMore Engineering.",
        });
      }
    } catch (insertErr) {
      console.error("Error inserting provider into PostgreSQL:", insertErr);
    }

    // Fallback store
    const fallbackProvider = {
      id: Date.now(),
      ...newProviderData,
      createdAt: new Date().toISOString(),
    };
    serverStore.users.push(fallbackProvider as any);

    return NextResponse.json({
      success: true,
      user: fallbackProvider,
      message: "Application submitted successfully! Your account is currently awaiting verification by QuestMore Engineering.",
    });
  } catch (error) {
    console.error("Provider auth error:", error);
    return NextResponse.json({ error: "Failed to process application" }, { status: 500 });
  }
}
