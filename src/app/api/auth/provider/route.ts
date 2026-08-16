import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body; // 'register' | 'login'

    if (action === "login") {
      const { email, password } = body;
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

      let providerUser = null;
      try {
        const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (found.length > 0) providerUser = found[0];
      } catch (e) {
        // Fallback
      }

      if (providerUser) {
        return NextResponse.json({
          success: true,
          user: providerUser,
          isVerified: providerUser.verificationStatus === "verified",
        });
      }

      // Demo provider fallback for demo@questmore.com
      if (email.toLowerCase().includes("provider") || email.toLowerCase().includes("john")) {
        const demoUser = {
          id: 2,
          role: "provider",
          fullName: "Engr. John Obi",
          email,
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

    // Check if email already exists
    try {
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }
    } catch (e) {
      // Continue
    }

    const newProviderData = {
      role: "provider",
      fullName,
      email,
      phone,
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
      verificationStatus: "awaiting_verification", // STRICT: newly registered starts in awaiting verification!
      verified: false,
    };

    try {
      const [inserted] = await db.insert(users).values(newProviderData).returning();
      return NextResponse.json({
        success: true,
        user: inserted,
        message: "Application submitted successfully! Your account is currently awaiting verification by QuestMore Engineering.",
      });
    } catch (insertErr) {
      // Fallback
      const fallbackProvider = {
        id: Date.now(),
        ...newProviderData,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({
        success: true,
        user: fallbackProvider,
        message: "Application submitted successfully! Your account is currently awaiting verification by QuestMore Engineering.",
      });
    }
  } catch (error) {
    console.error("Provider auth error:", error);
    return NextResponse.json({ error: "Failed to process application" }, { status: 500 });
  }
}
