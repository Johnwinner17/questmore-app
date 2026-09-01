import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/db";
import { payments } from "@/db/schema";
import { desc, eq, or, ilike } from "drizzle-orm";
import { fulfillPayment } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const search = req.nextUrl.searchParams.get("search");
    const status = req.nextUrl.searchParams.get("status");

    let query = db.select().from(payments);

    let allPayments: any[] = [];
    try {
      allPayments = await query.orderBy(desc(payments.createdAt)).limit(150);
    } catch (e) {
      console.error("DB payments query error:", e);
      return NextResponse.json([]);
    }

    let filtered = allPayments;

    if (status && status !== "all") {
      filtered = filtered.filter((p) => p.paymentStatus === status);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.reference?.toLowerCase().includes(q) ||
          p.customerEmail?.toLowerCase().includes(q) ||
          p.customerName?.toLowerCase().includes(q) ||
          p.paystackTxId?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

// POST /api/paystack/transactions — Admin action: Re-verify transaction with Paystack API
export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: "Reference is required." }, { status: 400 });
    }

    const res = await fulfillPayment(reference);
    if (!res.success) {
      return NextResponse.json({ error: res.error || "Verification failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, payment: res.payment });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
