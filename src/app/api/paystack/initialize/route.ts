import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/db";
import { payments } from "@/db/schema";
import { initializePaystackTransaction, PAYSTACK_PUBLIC_KEY } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const {
      email,
      fullName,
      phone,
      userId,
      requestId,
      amount,
      services = [],
      bookingFee = 5000,
      customReference,
      callbackUrl,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Client email is required for payment." }, { status: 400 });
    }

    // Calculate real backend amount to prevent frontend manipulation
    let calculatedAmount = 0;
    if (Array.isArray(services) && services.length > 0) {
      services.forEach((s: any) => {
        if (s.price && typeof s.price === "number" && !s.isNegotiable) {
          calculatedAmount += s.price;
        }
      });
    }

    const fee = typeof bookingFee === "number" ? bookingFee : 5000;
    const finalAmountInNaira = calculatedAmount > 0 ? calculatedAmount + fee : (amount || fee);

    if (finalAmountInNaira <= 0) {
      return NextResponse.json({ error: "Payment amount must be greater than zero." }, { status: 400 });
    }

    // Generate unique reference
    const reference =
      customReference ||
      `QM-PAY-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = fullName ? fullName.trim() : "QuestMore Client";
    const cleanPhone = phone ? phone.trim() : null;

    // Save pending transaction in PostgreSQL payments table
    try {
      await db.insert(payments).values({
        reference,
        userId: userId ? Number(userId) : null,
        requestId: requestId ? Number(requestId) : null,
        customerEmail: cleanEmail,
        customerName: cleanName,
        customerPhone: cleanPhone,
        expectedAmount: finalAmountInNaira,
        paidAmount: 0,
        currency: "NGN",
        paymentStatus: "pending",
        verificationStatus: "unverified",
        fulfillmentStatus: "unfulfilled",
        metadata: JSON.stringify({
          servicesCount: services.length,
          bookingFee: fee,
          requestId,
        }),
      });
    } catch (dbErr) {
      console.error("[Paystack Init] DB insert payment error:", dbErr);
    }

    // Call Paystack API
    const paystackRes = await initializePaystackTransaction({
      email: cleanEmail,
      amountInNaira: finalAmountInNaira,
      reference,
      callbackUrl,
      metadata: {
        customerName: cleanName,
        customerPhone: cleanPhone,
        requestId,
        userId,
        servicesCount: services.length,
      },
    });

    if (!paystackRes.status || !paystackRes.data) {
      console.error("[Paystack Init] Paystack API Error:", paystackRes);
      return NextResponse.json(
        { error: paystackRes.message || "Failed to initialize payment with Paystack." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      accessCode: paystackRes.data.access_code,
      authorizationUrl: paystackRes.data.authorization_url,
      publicKey: PAYSTACK_PUBLIC_KEY,
      amountInNaira: finalAmountInNaira,
      amountInKobo: Math.round(finalAmountInNaira * 100),
      currency: "NGN",
    });
  } catch (error: any) {
    console.error("[Paystack Init] Server error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error initializing payment." },
      { status: 500 }
    );
  }
}
